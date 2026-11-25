// Constantes seguras para o navegador (lib/db.ts acessa o banco e não pode ir ao cliente).
export type Categoria = "imposto" | "distribuidora" | "outros";

export const CATEGORIAS: { id: Categoria; rotulo: string }[] = [
  { id: "distribuidora", rotulo: "Distribuidora" },
  { id: "imposto", rotulo: "Imposto" },
  { id: "outros", rotulo: "Outros" },
];
