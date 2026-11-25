// Só roda no navegador: reduz a foto antes de enviar (fotos de celular passam de 4 MB, o limite da Vercel).
import type { LeituraBoleto } from "./ocr-boleto";

const LADO_MAXIMO = 1800; // nítido o bastante para ler os números, leve para enviar

async function reduzirImagem(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Não consegui preparar a foto."))), "image/jpeg", 0.88),
  );
}

/** Envia foto ou PDF para leitura e devolve os campos extraídos e validados. Lança Error com mensagem para o usuário. */
export async function lerBoletoDeArquivo(arquivo: File): Promise<LeituraBoleto> {
  const corpo = new FormData();
  if (arquivo.type === "application/pdf") {
    corpo.append("arquivo", arquivo);
  } else if (arquivo.type.startsWith("image/")) {
    corpo.append("arquivo", await reduzirImagem(arquivo), "boleto.jpg");
  } else {
    throw new Error("Envie uma foto ou um PDF.");
  }

  let resposta: Response;
  try {
    resposta = await fetch("/api/boleto", { method: "POST", body: corpo });
  } catch {
    throw new Error("Sem conexão. Verifique a internet e tente de novo.");
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(dados?.erro ?? "Não consegui ler o boleto.");
  return dados as LeituraBoleto;
}
