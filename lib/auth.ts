import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "peroba_sessao";

function assinatura(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não definido");
  return createHmac("sha256", secret).update("sessao-ok").digest("hex");
}

export function senhaCorreta(tentativa: string): boolean {
  const esperada = process.env.APP_SENHA ?? "";
  const a = Buffer.from(tentativa);
  const b = Buffer.from(esperada);
  return esperada.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export async function criarSessao() {
  (await cookies()).set(COOKIE, assinatura(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}

export async function logado(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value ?? "";
  const esperado = assinatura();
  return v.length === esperado.length && timingSafeEqual(Buffer.from(v), Buffer.from(esperado));
}

export async function exigirLogin() {
  if (!(await logado())) redirect("/login");
}
