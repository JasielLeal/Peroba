"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopiarLinha({ linha }: { linha: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(linha.replace(/\D/g, ""));
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }}
    >
      {ok ? <Check className="i" aria-hidden /> : <Copy className="i" aria-hidden />}
      {ok ? "Copiado" : "Copiar linha"}
    </button>
  );
}
