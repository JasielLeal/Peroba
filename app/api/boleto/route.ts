import { logado } from "@/lib/auth";
import { ErroLeitura, lerBoletoComIA, TIPOS_ACEITOS } from "@/lib/ocr-boleto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LIMITE = 4 * 1024 * 1024; // a Vercel recusa corpos acima de ~4,5 MB

// Recebe a foto/PDF do boleto e devolve os campos extraídos. Só para quem está logado.
export async function POST(req: Request) {
  if (!(await logado())) return Response.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });
  const arquivo = (await req.formData()).get("arquivo");
  if (!(arquivo instanceof File)) return Response.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  if (!(TIPOS_ACEITOS as readonly string[]).includes(arquivo.type)) {
    return Response.json({ erro: "Envie uma foto (JPG, PNG, WebP) ou um PDF." }, { status: 415 });
  }
  if (arquivo.size > LIMITE) return Response.json({ erro: "Arquivo grande demais (máximo 4 MB)." }, { status: 413 });

  try {
    const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");
    return Response.json(await lerBoletoComIA(base64, arquivo.type as (typeof TIPOS_ACEITOS)[number]));
  } catch (e) {
    if (e instanceof ErroLeitura) return Response.json({ erro: e.message }, { status: e.status });
    console.error("[ocr]", e);
    return Response.json({ erro: "Não consegui ler o boleto." }, { status: 500 });
  }
}
