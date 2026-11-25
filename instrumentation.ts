// Agendador embutido (só vale em servidor que fica ligado, como VPS). Em hospedagem serverless,
// use um cron externo chamando GET /api/lembretes (ver README).
//
// Roda no máximo uma vez por dia, depois da hora configurada. O tick de 15 min não consulta o banco
// enquanto o dia já foi atendido, para o Neon poder "dormir" (scale-to-zero) sem ser acordado à toa.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL) return; // na Vercel quem dispara é o cron (vercel.json)
  const { horaBR, hojeBR } = await import("./lib/datas");
  const { enviarLembretes } = await import("./lib/lembretes");

  let diaConcluido = "";

  const tick = async () => {
    const hoje = hojeBR();
    if (diaConcluido === hoje || horaBR() < Number(process.env.LEMBRETE_HORA ?? 9)) return;
    try {
      const r = await enviarLembretes();
      if (r.enviados || r.erros.length) console.log("[lembretes]", r);
      if (r.erros.length === 0) diaConcluido = hoje; // com erro, tenta de novo no próximo tick
    } catch (e) {
      console.error("[lembretes] falhou:", e);
    }
  };
  setInterval(tick, 15 * 60 * 1000);
  setTimeout(tick, 10_000);
}
