// Envio via Evolution API (https://doc.evolution-api.com).
// Para trocar de provedor (ex.: API oficial da Meta), mexa só neste arquivo.
export async function enviarWhatsApp(texto: string): Promise<void> {
  const { EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, WHATSAPP_DESTINO } = process.env;
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE || !WHATSAPP_DESTINO) {
    throw new Error("Configuração do WhatsApp incompleta (.env.local)");
  }
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
    body: JSON.stringify({ number: WHATSAPP_DESTINO, text: texto }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
