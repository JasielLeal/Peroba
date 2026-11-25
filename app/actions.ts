"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarSessao, encerrarSessao, exigirLogin, senhaCorreta } from "@/lib/auth";
import { CATEGORIAS, consultar, fornecedoresConhecidos } from "@/lib/db";
import { parseReais } from "@/lib/datas";
import { enviarLembretes } from "@/lib/lembretes";

export async function entrar(_: string | null, form: FormData): Promise<string | null> {
  if (!senhaCorreta(String(form.get("senha") ?? ""))) return "Senha incorreta";
  await criarSessao();
  redirect("/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

export async function criarBoleto(_: string | null, form: FormData): Promise<string | null> {
  await exigirLogin();
  const categoria = String(form.get("categoria") ?? "");
  const fornecedor = String(form.get("fornecedor") ?? "").trim() || null;
  const descricao = String(form.get("descricao") ?? "").trim() || fornecedor || "";
  const valor = parseReais(String(form.get("valor") ?? ""));
  const vencimento = String(form.get("vencimento") ?? "");
  const linha = String(form.get("linha") ?? "").trim() || null;

  if (!CATEGORIAS.some((c) => c.id === categoria)) return "Escolha o tipo do boleto";
  if (categoria === "distribuidora" && !fornecedor) return "Informe a distribuidora";
  if (!descricao) return "Informe a descrição";
  if (valor === null) return "Valor inválido";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return "Informe o vencimento";

  await consultar(
    "INSERT INTO boletos (descricao, valor_centavos, vencimento, linha_digitavel, categoria, fornecedor) VALUES ($1, $2, $3, $4, $5, $6)",
    [descricao, valor, vencimento, linha, categoria, fornecedor],
  );
  revalidatePath("/");
  return null;
}

export async function listarFornecedores(): Promise<string[]> {
  await exigirLogin();
  return fornecedoresConhecidos();
}

export async function marcarPago(id: number) {
  await exigirLogin();
  await consultar("UPDATE boletos SET status = 'pago' WHERE id = $1", [id]);
  revalidatePath("/");
}

export async function reabrir(id: number) {
  await exigirLogin();
  await consultar("UPDATE boletos SET status = 'pendente' WHERE id = $1", [id]);
  revalidatePath("/");
}

export async function excluir(id: number) {
  await exigirLogin();
  await consultar("DELETE FROM boletos WHERE id = $1", [id]);
  revalidatePath("/");
}

export async function dispararLembretes(): Promise<string> {
  await exigirLogin();
  const r = await enviarLembretes();
  revalidatePath("/");
  if (r.erros.length) return `Falha no envio: ${r.erros[0]}`;
  return r.enviados ? `${r.enviados} lembrete(s) enviado(s)` : "Nenhum lembrete pendente";
}

// ---------- Estoque faltante ----------

export async function criarFaltante(_: string | null, form: FormData): Promise<string | null> {
  await exigirLogin();
  const item = String(form.get("item") ?? "").trim();
  const quantidade = String(form.get("quantidade") ?? "").trim() || null;
  const fornecedor = String(form.get("fornecedor") ?? "").trim() || null;
  if (!item) return "Informe o item";
  if (item.length > 120) return "Nome do item muito longo";
  await consultar("INSERT INTO faltantes (item, quantidade, fornecedor) VALUES ($1, $2, $3)", [item, quantidade, fornecedor]);
  revalidatePath("/estoque");
  return null;
}

export async function alternarFaltante(id: number) {
  await exigirLogin();
  await consultar("UPDATE faltantes SET comprado = NOT comprado WHERE id = $1", [id]);
  revalidatePath("/estoque");
}

export async function excluirFaltante(id: number) {
  await exigirLogin();
  await consultar("DELETE FROM faltantes WHERE id = $1", [id]);
  revalidatePath("/estoque");
}

export async function limparComprados() {
  await exigirLogin();
  await consultar("DELETE FROM faltantes WHERE comprado");
  revalidatePath("/estoque");
}

export async function limparTudo() {
  await exigirLogin();
  await consultar("DELETE FROM faltantes");
  revalidatePath("/estoque");
}
