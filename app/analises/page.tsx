import { ChartPie, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { exigirLogin } from "@/lib/auth";
import { carregarAnalise, carregarAtencao } from "@/lib/analises";
import { CATEGORIAS } from "@/lib/categorias";
import { formatarReais, hojeBR, rotuloMes } from "@/lib/datas";
import Barra from "../barra";
import { BarrasMeses, Rosca, type Fatia } from "../graficos";
import { mesDoParametro, opcoesDeMes } from "../opcoes-mes";
import SeletorMes from "../seletor-mes";
import Topo from "../topo";

export const dynamic = "force-dynamic";

const COR = { distribuidora: "#071d63", imposto: "#d90000", outros: "#9aa3bd" } as const;
const pct = (v: number, t: number) => (t > 0 ? Math.round((v / t) * 100) : 0);

export default async function Analises({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirLogin();
  const hoje = hojeBR();
  const mesAtual = hoje.slice(0, 7);
  const mes = mesDoParametro((await searchParams).mes, mesAtual);
  const [a, atencao] = await Promise.all([carregarAnalise(mes), carregarAtencao(hoje)]);

  const fatias: Fatia[] = a.categorias.map((c) => ({
    rotulo: CATEGORIAS.find((x) => x.id === c.categoria)!.rotulo,
    valor: c.valor,
    qtd: c.qtd,
    cor: COR[c.categoria],
  }));
  const totalDistrib = a.distribuidoras.reduce((s, d) => s + d.valor, 0);
  const maxDistrib = Math.max(...a.distribuidoras.map((d) => d.valor), 1);

  const variacao = a.totalAnterior > 0 ? Math.round(((a.total - a.totalAnterior) / a.totalAnterior) * 100) : null;
  const Seta = variacao === null || variacao === 0 ? Minus : variacao > 0 ? TrendingUp : TrendingDown;

  return (
    <main>
      <Topo />

      <section className="hero" aria-label="Total do mês">
        <div className="linha">
          <span className="rotulo">Total em boletos · {rotuloMes(mes)}</span>
          <SeletorMes atual={mes} opcoes={opcoesDeMes(mesAtual, mes)} rota="/analises" />
        </div>
        <div className="valor">{formatarReais(a.total)}</div>
        <span className="pilula-delta">
          <Seta aria-hidden />
          {variacao === null ? "Sem mês anterior para comparar" : variacao === 0 ? "Igual ao mês passado" : `${Math.abs(variacao)}% ${variacao > 0 ? "maior" : "menor"} que o mês passado`}
        </span>
      </section>

      {a.qtd === 0 ? (
        <div className="vazio">
          <ChartPie aria-hidden />
          <strong>Sem boletos em {rotuloMes(mes)}</strong>
          <p>Escolha outro mês ou cadastre boletos para ver as análises.</p>
        </div>
      ) : (
        <>
          <section className="cartao" aria-label="Pago e pendente">
            <div className="secao"><h2>Pago x pendente</h2><span>{a.qtd} {a.qtd === 1 ? "boleto" : "boletos"}</span></div>
            <div className="progresso" role="img" aria-label={`${pct(a.pago, a.total)}% pago`}>
              <div style={{ width: `${pct(a.pago, a.total)}%` }} />
            </div>
            <div className="duas-col">
              <div><small>Pago</small><b className="verde">{formatarReais(a.pago)}</b></div>
              <div><small>Pendente</small><b>{formatarReais(a.pendente)}</b></div>
            </div>
          </section>

          <section className="cartao" aria-label="Por tipo">
            <div className="secao"><h2>Para onde vai o dinheiro</h2></div>
            <div className="rosca-bloco">
              <Rosca fatias={fatias} centro={formatarReais(a.total)} sub="no mês" />
              <ul className="legenda">
                {fatias.map((f) => (
                  <li key={f.rotulo}>
                    <i style={{ background: f.cor }} />
                    <span>
                      <b>{f.rotulo}</b>
                      <small>{f.qtd} {f.qtd === 1 ? "boleto" : "boletos"}</small>
                    </span>
                    <span className="num">
                      <b>{formatarReais(f.valor)}</b>
                      <small>{pct(f.valor, a.total)}%</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="cartao" aria-label="Distribuidoras">
            <div className="secao"><h2>Distribuidoras</h2><span>{a.distribuidoras.length} no mês</span></div>
            {a.distribuidoras.length === 0 ? (
              <p className="nota">Nenhum boleto de distribuidora neste mês.</p>
            ) : (
              <ol className="ranking">
                {a.distribuidoras.slice(0, 8).map((d, i) => (
                  <li key={d.nome}>
                    <span className="pos">{i + 1}</span>
                    <div className="info">
                      <div className="nome"><b>{d.nome}</b><b>{formatarReais(d.valor)}</b></div>
                      <div className="trilho"><div style={{ width: `${(d.valor / maxDistrib) * 100}%` }} /></div>
                      <small>{d.qtd} {d.qtd === 1 ? "boleto" : "boletos"} · {pct(d.valor, totalDistrib)}% das distribuidoras</small>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="cartao" aria-label="Evolução">
            <div className="secao"><h2>Evolução (6 meses)</h2></div>
            <BarrasMeses dados={a.evolucao} atual={mes} />
          </section>

          <section aria-label="Indicadores">
            <div className="secao"><h2>Indicadores</h2></div>
            <div className="grade">
              <div className="ind"><small>Em atraso ({atencao.vencidos.qtd})</small><b className={atencao.vencidos.qtd ? "vermelho" : ""}>{formatarReais(atencao.vencidos.valor)}</b></div>
              <div className="ind"><small>Próximos 7 dias ({atencao.proximos7.qtd})</small><b>{formatarReais(atencao.proximos7.valor)}</b></div>
              <div className="ind"><small>Valor médio por boleto</small><b>{formatarReais(a.ticketMedio)}</b></div>
              <div className="ind">
                <small>Maior boleto</small>
                <b>{a.maior ? formatarReais(a.maior.valor_centavos) : "—"}</b>
                {a.maior && <small className="sub">{a.maior.fornecedor ?? a.maior.descricao}</small>}
              </div>
            </div>
          </section>
        </>
      )}

      <Barra ativo="analises" />
    </main>
  );
}
