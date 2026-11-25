"use client";

import { CircleAlert } from "lucide-react";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ paddingTop: 56 }}>
      <div className="vazio" role="alert">
        <CircleAlert aria-hidden style={{ color: "var(--red)" }} />
        <strong>Não foi possível carregar</strong>
        <p>Ocorreu um erro inesperado. Tente novamente.</p>
        <button className="primario" style={{ marginTop: 12 }} onClick={reset}>Tentar novamente</button>
      </div>
    </main>
  );
}
