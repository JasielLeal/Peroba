"use client";

import Link from "next/link";
import { ChartPie, CircleCheck, ClipboardList, ScanText } from "lucide-react";
import { useNovoBoleto } from "./novo-provider";

// Ações rápidas da tela inicial. "Novo boleto" abre direto a câmera do celular; a foto é lida por IA
// e abre o formulário já preenchido. Cancelar a câmera não faz nada (continua na tela inicial).
export default function Atalhos() {
  const { abrir } = useNovoBoleto();
  return (
    <nav className="atalhos" aria-label="Ações rápidas">
      <label className="atalho destaque">
        <span className="quadro"><ScanText aria-hidden /></span>
        Novo boleto
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (arquivo) abrir(arquivo);
          }}
        />
      </label>
      <Link href="/estoque" className="atalho">
        <span className="quadro"><ClipboardList aria-hidden /></span>
        Estoque
      </Link>
      <Link href="/analises" className="atalho">
        <span className="quadro"><ChartPie aria-hidden /></span>
        Análises
      </Link>
      <Link href="/pagos" className="atalho">
        <span className="quadro"><CircleCheck aria-hidden /></span>
        Pagos
      </Link>
    </nav>
  );
}
