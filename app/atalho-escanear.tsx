"use client";

import Link from "next/link";
import { ChartPie, CircleCheck, ClipboardList, ScanText } from "lucide-react";
import { useNovoBoleto } from "./novo-provider";

// Ações rápidas da tela inicial. "Novo boleto" abre a câmera com moldura; a foto é lida por IA
// e abre o formulário já preenchido. Cancelar a câmera volta para a tela inicial.
export default function Atalhos() {
  const { fotografar } = useNovoBoleto();
  return (
    <nav className="atalhos" aria-label="Ações rápidas">
      <button className="atalho destaque" onClick={fotografar}>
        <span className="quadro"><ScanText aria-hidden /></span>
        Novo boleto
      </button>
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
