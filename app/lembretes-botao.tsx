"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { dispararLembretes } from "./actions";

export default function LembretesBotao() {
  const [retorno, acao, pendente] = useActionState<string | null>(() => dispararLembretes(), null);
  return (
    <form action={acao}>
      <button disabled={pendente}>
        {pendente ? <span className="spin" aria-hidden /> : <BellRing className="i" aria-hidden />}
        Enviar lembretes agora
      </button>
      {retorno && <p className="retorno" role="status">{retorno}</p>}
    </form>
  );
}
