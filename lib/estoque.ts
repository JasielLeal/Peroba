import { consultar } from "./db";

export type Faltante = {
  id: number;
  item: string;
  quantidade: string | null;
  fornecedor: string | null; // distribuidora de onde comprar
  comprado: boolean;
};

export type GrupoFaltante = { nome: string | null; itens: Faltante[] };

export async function listarFaltantes(): Promise<Faltante[]> {
  return consultar<Faltante>(
    "SELECT id, item, quantidade, fornecedor, comprado FROM faltantes ORDER BY comprado, id LIMIT 500",
  );
}

/** Agrupa por distribuidora (ignorando maiúsculas/espaços). Grupos com nome em ordem alfabética; "sem distribuidora" por último. */
export function agruparPorDistribuidora(itens: Faltante[]): GrupoFaltante[] {
  const mapa = new Map<string, GrupoFaltante>();
  for (const i of itens) {
    const nome = i.fornecedor?.trim() || null;
    const chave = nome ? nome.toLowerCase() : "";
    const g = mapa.get(chave) ?? { nome, itens: [] };
    g.itens.push(i);
    mapa.set(chave, g);
  }
  return [...mapa.values()].sort((a, b) =>
    a.nome === null ? 1 : b.nome === null ? -1 : a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** Texto da lista (só o que ainda falta comprar) para colar no WhatsApp. */
export function textoDaLista(itens: Faltante[]): string {
  const pendentes = itens.filter((i) => !i.comprado);
  if (pendentes.length === 0) return "";
  const linhas = ["*Lista de compras*"];
  for (const g of agruparPorDistribuidora(pendentes)) {
    linhas.push("", `*${g.nome ?? "Sem distribuidora"}*`);
    for (const i of g.itens) linhas.push(`- ${i.item}${i.quantidade ? ` (${i.quantidade})` : ""}`);
  }
  return linhas.join("\n");
}
