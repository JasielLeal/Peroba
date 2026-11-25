"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eraser, Trash2 } from "lucide-react";
import { limparComprados, limparTudo } from "../actions";
import SubmitButton from "../submit-button";

export default function AcoesLista({ texto, comprados, total }: { texto: string; comprados: number; total: number }) {
  const [copiado, setCopiado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  if (total === 0) return null;

  return (
    <div className="lista-acoes">
      <button
        type="button"
        disabled={!texto}
        onClick={async () => {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
        }}
      >
        {copiado ? <Check className="i" aria-hidden /> : <Copy className="i" aria-hidden />}
        {copiado ? "Lista copiada" : "Copiar lista"}
      </button>

      <form action={limparComprados}>
        <SubmitButton className={comprados ? "" : "desativado"}>
          <Eraser className="i" aria-hidden /> Limpar comprados ({comprados})
        </SubmitButton>
      </form>

      {confirmando ? (
        <div className="confirma" role="alertdialog" aria-label="Confirmar limpeza">
          <span>Apagar os {total} itens da lista?</span>
          <form action={limparTudo}>
            <SubmitButton className="perigo">Apagar tudo</SubmitButton>
          </form>
          <button type="button" onClick={() => setConfirmando(false)}>Cancelar</button>
        </div>
      ) : (
        <button type="button" className="perigo" onClick={() => setConfirmando(true)}>
          <Trash2 className="i" aria-hidden /> Limpar tudo
        </button>
      )}
    </div>
  );
}
