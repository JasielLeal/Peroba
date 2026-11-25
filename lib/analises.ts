import { COLUNAS, consultar, type Boleto, type Categoria } from "./db";
import { somarDias, somarMes } from "./datas";

export type PorCategoria = { categoria: Categoria; valor: number; qtd: number };
export type PorFornecedor = { nome: string; valor: number; qtd: number };
export type MesTotal = { mes: string; valor: number };

export type Analise = {
  mes: string;
  total: number;
  qtd: number;
  totalAnterior: number;
  pago: number;
  pendente: number;
  categorias: PorCategoria[];
  distribuidoras: PorFornecedor[];
  evolucao: MesTotal[];
  maior: Boleto | null;
  ticketMedio: number;
};

export type Atencao = { vencidos: { valor: number; qtd: number }; proximos7: { valor: number; qtd: number } };

function somar(lista: Boleto[]) {
  return lista.reduce((s, b) => s + b.valor_centavos, 0);
}

export async function carregarAnalise(mes: string): Promise<Analise> {
  const inicio = somarMes(mes, -5);
  const linhas = await consultar<Boleto>(
    `SELECT ${COLUNAS} FROM boletos WHERE substr(vencimento, 1, 7) BETWEEN $1 AND $2`,
    [inicio, mes],
  );

  const doMes = linhas.filter((b) => b.vencimento.startsWith(mes));
  const anterior = linhas.filter((b) => b.vencimento.startsWith(somarMes(mes, -1)));

  const categorias = (["distribuidora", "imposto", "outros"] as Categoria[]).map((c) => {
    const l = doMes.filter((b) => b.categoria === c);
    return { categoria: c, valor: somar(l), qtd: l.length };
  });

  // Agrupa distribuidoras ignorando maiúsculas/espaços; mostra o nome na primeira grafia encontrada.
  const grupos = new Map<string, PorFornecedor>();
  for (const b of doMes.filter((x) => x.categoria === "distribuidora")) {
    const nome = b.fornecedor?.trim() || "Sem nome";
    const chave = nome.toLowerCase();
    const g = grupos.get(chave) ?? { nome, valor: 0, qtd: 0 };
    g.valor += b.valor_centavos;
    g.qtd += 1;
    grupos.set(chave, g);
  }
  const distribuidoras = [...grupos.values()].sort((a, b) => b.valor - a.valor);

  const evolucao = Array.from({ length: 6 }, (_, i) => {
    const m = somarMes(mes, i - 5);
    return { mes: m, valor: somar(linhas.filter((b) => b.vencimento.startsWith(m))) };
  });

  const total = somar(doMes);
  return {
    mes,
    total,
    qtd: doMes.length,
    totalAnterior: somar(anterior),
    pago: somar(doMes.filter((b) => b.status === "pago")),
    pendente: somar(doMes.filter((b) => b.status === "pendente")),
    categorias,
    distribuidoras,
    evolucao,
    maior: doMes.reduce<Boleto | null>((m, b) => (!m || b.valor_centavos > m.valor_centavos ? b : m), null),
    ticketMedio: doMes.length ? Math.round(total / doMes.length) : 0,
  };
}

/** Indicadores globais (independem do mês escolhido): atrasados e vencendo nos próximos 7 dias. */
export async function carregarAtencao(hoje: string): Promise<Atencao> {
  const base =
    "SELECT COALESCE(SUM(valor_centavos), 0)::int AS v, COUNT(*)::int AS q FROM boletos WHERE status = 'pendente'";
  const [[venc], [prox]] = await Promise.all([
    consultar<{ v: number; q: number }>(`${base} AND vencimento < $1`, [hoje]),
    consultar<{ v: number; q: number }>(`${base} AND vencimento >= $1 AND vencimento <= $2`, [hoje, somarDias(hoje, 7)]),
  ]);
  return { vencidos: { valor: venc.v, qtd: venc.q }, proximos7: { valor: prox.v, qtd: prox.q } };
}
