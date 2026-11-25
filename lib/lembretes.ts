import { COLUNAS, consultar, type Boleto } from "./db";
import { diasEntre, formatarData, formatarReais, hojeBR } from "./datas";
import { enviarWhatsApp } from "./whatsapp";

function montarMensagem(b: Boleto, dias: number): string {
  const quando = dias === 0 ? "vence *HOJE*" : dias === 1 ? "vence *amanhã*" : `vence em *${dias} dias*`;
  const nome = process.env.NOME_DESTINO ? `Oi, ${process.env.NOME_DESTINO}! ` : "Oi! ";
  let msg = `${nome}Lembrete: o boleto *${b.descricao}* de *${formatarReais(b.valor_centavos)}* ${quando} (${formatarData(b.vencimento)}).`;
  if (b.linha_digitavel) msg += `\n\nLinha digitável:\n${b.linha_digitavel}`;
  return msg;
}

// Idempotente: cada boleto só é avisado uma vez (avisado_em). Pode rodar quantas vezes quiser.
export async function enviarLembretes(): Promise<{ enviados: number; erros: string[] }> {
  const limite = Number(process.env.LEMBRETE_DIAS ?? 2);
  const hoje = hojeBR();
  const pendentes = await consultar<Boleto>(
    `SELECT ${COLUNAS} FROM boletos WHERE status = 'pendente' AND avisado_em IS NULL ORDER BY vencimento`,
  );

  let enviados = 0;
  const erros: string[] = [];
  for (const b of pendentes) {
    const dias = diasEntre(hoje, b.vencimento);
    if (dias < 0 || dias > limite) continue;
    try {
      await enviarWhatsApp(montarMensagem(b, dias));
      await consultar("UPDATE boletos SET avisado_em = now() WHERE id = $1", [b.id]);
      enviados++;
    } catch (e) {
      erros.push(`#${b.id}: ${(e as Error).message}`);
    }
  }
  return { enviados, erros };
}
