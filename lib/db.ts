import { neon } from "@neondatabase/serverless";

import { CATEGORIAS, type Categoria } from "./categorias";
export { CATEGORIAS, type Categoria };

export type Boleto = {
  id: number;
  descricao: string;
  valor_centavos: number;
  vencimento: string; // YYYY-MM-DD
  linha_digitavel: string | null;
  status: "pendente" | "pago";
  avisado_em: string | null;
  categoria: Categoria;
  fornecedor: string | null; // nome da distribuidora / favorecido
};

// Colunas lidas pelo app. avisado_em vai como texto para atravessar server/client sem objetos Date.
export const COLUNAS =
  "id, descricao, valor_centavos, vencimento, linha_digitavel, status, avisado_em::text AS avisado_em, categoria, fornecedor";

const g = globalThis as unknown as {
  __sql?: ReturnType<typeof neon>;
  __schema?: Promise<void> | null;
};

function conexao() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definido (string de conexão do Neon)");
  return (g.__sql ??= neon(url));
}

// Cria a tabela na primeira consulta de cada processo. Se falhar, tenta de novo na próxima.
function garantirSchema(): Promise<void> {
  if (!g.__schema) {
    g.__schema = (async () => {
      const sql = conexao();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS boletos (
          id SERIAL PRIMARY KEY,
          descricao TEXT NOT NULL,
          valor_centavos INTEGER NOT NULL,
          vencimento TEXT NOT NULL,
          linha_digitavel TEXT,
          status TEXT NOT NULL DEFAULT 'pendente',
          avisado_em TIMESTAMPTZ,
          categoria TEXT NOT NULL DEFAULT 'outros',
          fornecedor TEXT,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await sql.query("CREATE INDEX IF NOT EXISTS boletos_status_venc ON boletos (status, vencimento)");
      await sql.query(`
        CREATE TABLE IF NOT EXISTS faltantes (
          id SERIAL PRIMARY KEY,
          item TEXT NOT NULL,
          quantidade TEXT,
          fornecedor TEXT,
          comprado BOOLEAN NOT NULL DEFAULT false,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
    })().catch((e) => {
      g.__schema = null;
      throw e;
    });
  }
  return g.__schema;
}

/** Executa uma consulta parametrizada ($1, $2…) e devolve as linhas. */
export async function consultar<T = Record<string, unknown>>(texto: string, params: unknown[] = []): Promise<T[]> {
  await garantirSchema();
  return (await conexao().query(texto, params as never[])) as unknown as T[];
}

/** Soma dos boletos com vencimento no mês (YYYY-MM). `soPendentes` ignora os já pagos. */
export async function totalDoMes(mes: string, soPendentes: boolean): Promise<number> {
  const filtro = soPendentes ? "AND status = 'pendente'" : "";
  const [r] = await consultar<{ t: number }>(
    `SELECT COALESCE(SUM(valor_centavos), 0)::int AS t FROM boletos WHERE substr(vencimento, 1, 7) = $1 ${filtro}`,
    [mes],
  );
  return r.t;
}

export async function listarBoletos(status: "pendente" | "pago"): Promise<Boleto[]> {
  const ordem = status === "pendente" ? "ASC" : "DESC";
  return consultar<Boleto>(
    `SELECT ${COLUNAS} FROM boletos WHERE status = $1 ORDER BY vencimento ${ordem}, id ${ordem} LIMIT 100`,
    [status],
  );
}

export async function fornecedoresConhecidos(): Promise<string[]> {
  const linhas = await consultar<{ fornecedor: string }>(
    "SELECT fornecedor FROM (SELECT fornecedor FROM boletos UNION ALL SELECT fornecedor FROM faltantes) t WHERE fornecedor IS NOT NULL GROUP BY fornecedor ORDER BY COUNT(*) DESC LIMIT 50",
  );
  return linhas.map((l) => l.fornecedor);
}
