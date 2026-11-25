// Só roda no navegador. Prepara a foto para leitura: a página inteira reduzida, mais faixas ampliadas.
// Os modelos de visão reduzem a imagem inteira para ~768 px de largura, o que borra números miúdos como a
// linha digitável; as faixas (em tela cheia, com sobreposição) devolvem o detalhe que falta.
import type { LeituraBoleto } from "./ocr-boleto";

const LADO_PAGINA = 2000;
const LADO_FAIXA = 2600;
const FAIXAS = 7;
const ALTURA_FAIXA = 0.22; // fração da altura da foto; as faixas se sobrepõem. Fina e ampliada: em teste, 6/6 acertos (4 faixas de 38% davam 3/6)
const LIMITE_TOTAL = 3.8 * 1024 * 1024; // a Vercel recusa corpos acima de ~4,5 MB

function recortar(bitmap: ImageBitmap, sx: number, sy: number, sw: number, sh: number, ladoMax: number, escalaMax: number, qualidade: number): Promise<Blob> {
  const escala = Math.min(escalaMax, ladoMax / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * escala);
  canvas.height = Math.round(sh * escala);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Não consegui preparar a foto."))), "image/jpeg", qualidade),
  );
}

async function prepararImagem(arquivo: File): Promise<{ pagina: Blob; faixas: Blob[] }> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const { width: W, height: H } = bitmap;

  let qualidade = 0.86;
  let pagina = await recortar(bitmap, 0, 0, W, H, LADO_PAGINA, 1, qualidade);
  const faixas: Blob[] = [];
  if (H >= 700) {
    const altura = Math.round(H * ALTURA_FAIXA);
    const passo = (H - altura) / (FAIXAS - 1);
    for (let i = 0; i < FAIXAS; i++) {
      faixas.push(await recortar(bitmap, 0, Math.round(i * passo), W, altura, LADO_FAIXA, 2.2, qualidade));
    }
  }

  // Cabe no limite da Vercel: primeiro baixa a qualidade, depois descarta faixas (a página inteira sempre vai).
  const total = () => pagina.size + faixas.reduce((s, f) => s + f.size, 0);
  if (total() > LIMITE_TOTAL) {
    qualidade = 0.7;
    pagina = await recortar(bitmap, 0, 0, W, H, LADO_PAGINA, 1, qualidade);
    for (let i = 0; i < faixas.length; i++) {
      const altura = Math.round(H * ALTURA_FAIXA);
      faixas[i] = await recortar(bitmap, 0, Math.round((i * (H - altura)) / (FAIXAS - 1)), W, altura, LADO_FAIXA, 2.2, qualidade);
    }
  }
  while (total() > LIMITE_TOTAL && faixas.length) faixas.pop();

  bitmap.close();
  return { pagina, faixas };
}

/** Envia foto ou PDF para leitura e devolve os campos extraídos e validados. Lança Error com mensagem para o usuário. */
export async function lerBoletoDeArquivo(arquivo: File): Promise<LeituraBoleto> {
  const corpo = new FormData();
  if (arquivo.type === "application/pdf") {
    corpo.append("arquivo", arquivo); // PDF já traz o texto nítido: vai inteiro
  } else if (arquivo.type.startsWith("image/")) {
    const { pagina, faixas } = await prepararImagem(arquivo);
    corpo.append("arquivo", pagina, "boleto.jpg");
    faixas.forEach((f, i) => corpo.append("recorte", f, `faixa${i + 1}.jpg`));
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
