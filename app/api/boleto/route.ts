import { logado } from "@/lib/auth";
import { ErroLeitura, lerBoletoComIA, TIPOS_ACEITOS, type Imagem } from "@/lib/ocr-boleto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LIMITE_TOTAL = 4 * 1024 * 1024; // a Vercel recusa corpos acima de ~4,5 MB
const MAX_RECORTES = 8;

const aceito = (tipo: string): tipo is Imagem["mediaType"] => (TIPOS_ACEITOS as readonly string[]).includes(tipo);

// Recebe a foto/PDF do boleto ("arquivo") e, opcionalmente, recortes ampliados da foto ("recorte").
// Devolve os campos extraídos e validados. Só para quem está logado.
export async function POST(req: Request) {
  if (!(await logado())) return Response.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });

  const form = await req.formData();
  const arquivo = form.get("arquivo");
  const recortes = form.getAll("recorte").filter((r): r is File => r instanceof File);

  if (!(arquivo instanceof File)) return Response.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  if (!aceito(arquivo.type)) return Response.json({ erro: "Envie uma foto (JPG, PNG, WebP) ou um PDF." }, { status: 415 });
  if (arquivo.type === "application/pdf" && recortes.length) {
    return Response.json({ erro: "PDF não leva recortes." }, { status: 400 });
  }
  if (recortes.length > MAX_RECORTES || recortes.some((r) => !r.type.startsWith("image/") || !aceito(r.type))) {
    return Response.json({ erro: "Recortes inválidos." }, { status: 400 });
  }
  if ([arquivo, ...recortes].reduce((s, f) => s + f.size, 0) > LIMITE_TOTAL) {
    return Response.json({ erro: "Arquivo grande demais (máximo 4 MB)." }, { status: 413 });
  }

  try {
    const imagens: Imagem[] = await Promise.all(
      [arquivo, ...recortes].map(async (f) => ({
        base64: Buffer.from(await f.arrayBuffer()).toString("base64"),
        mediaType: f.type as Imagem["mediaType"],
      })),
    );
    return Response.json(await lerBoletoComIA(imagens));
  } catch (e) {
    if (e instanceof ErroLeitura) return Response.json({ erro: e.message }, { status: e.status });
    console.error("[ocr]", e);
    return Response.json({ erro: "Não consegui ler o boleto." }, { status: 500 });
  }
}
