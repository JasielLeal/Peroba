import Link from "next/link";
import { ArrowRight, CircleCheck, TrendingDown, TrendingUp } from "lucide-react";
import { exigirLogin } from "@/lib/auth";
import { carregarAnalise } from "@/lib/analises";
import { listarBoletos, totalDoMes } from "@/lib/db";
import { formatarReais, hojeBR, somarMes } from "@/lib/datas";
import Atalhos from "./atalho-escanear";
import Barra from "./barra";
import ParaOndeVai from "./para-onde-vai";
import ItemBoleto from "./item-boleto";
import { mesDoParametro, opcoesDeMes } from "./opcoes-mes";
import SeletorMes from "./seletor-mes";
import Topo from "./topo";

export const dynamic = "force-dynamic";

function Variacao({ total, anterior }: { total: number; anterior: number }) {
  if (anterior <= 0) return <span className="pilula-delta">Sem mês anterior para comparar</span>;
  const pct = Math.round(((total - anterior) / anterior) * 100);
  if (pct === 0) return <span className="pilula-delta">Igual ao mês passado</span>;
  const Seta = pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className="pilula-delta">
      <Seta aria-hidden /> {Math.abs(pct)}% {pct > 0 ? "maior" : "menor"} que o mês passado
    </span>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await exigirLogin();
  const hoje = hojeBR();
  const mesAtual = hoje.slice(0, 7);
  const mes = mesDoParametro((await searchParams).mes, mesAtual);

  const [pendenteMes, totalMes, totalAnterior, analise, pendentes] = await Promise.all([
    totalDoMes(mes, true),
    totalDoMes(mes, false),
    totalDoMes(somarMes(mes, -1), false),
    carregarAnalise(mes),
    listarBoletos("pendente"),
  ]);
  const proximos = pendentes.slice(0, 15);

  return (
    <main>
      <Topo />

      <section className="hero" aria-label="Resumo financeiro">
        <div className="linha">
          <span className="rotulo">Total pendente</span>
          <SeletorMes atual={mes} opcoes={opcoesDeMes(mesAtual, mes)} />
        </div>
        <div className="valor">{formatarReais(pendenteMes)}</div>
        <Variacao total={totalMes} anterior={totalAnterior} />
      </section>

      <Atalhos />

      <ParaOndeVai categorias={analise.categorias} mes={mes} />

      <div className="secao">
        <h2>Próximos vencimentos</h2>
        <Link href="/analises">Análises <ArrowRight aria-hidden /></Link>
      </div>
      {proximos.length === 0 ? (
        <div className="vazio">
          <CircleCheck aria-hidden />
          <strong>Tudo em dia</strong>
          <p>Nenhum boleto pendente. Toque no + para cadastrar.</p>
        </div>
      ) : (
        <div className="painel-lista">
          {proximos.map((b) => <ItemBoleto key={b.id} b={b} hoje={hoje} />)}
        </div>
      )}

      <Barra ativo="inicio" />
    </main>
  );
}
