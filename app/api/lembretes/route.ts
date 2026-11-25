import { enviarLembretes } from "@/lib/lembretes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Disparo por cron externo. Aceita `x-cron-secret: <CRON_SECRET>` ou `Authorization: Bearer <CRON_SECRET>`
// (formato usado pelo Vercel Cron).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const enviado = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secret || enviado !== secret) {
    return new Response("não autorizado", { status: 401 });
  }
  return Response.json(await enviarLembretes());
}
