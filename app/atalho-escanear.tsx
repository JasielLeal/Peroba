"use client";

import Link from "next/link";
import { ChartPie, CircleCheck, ClipboardList, ScanBarcode } from "lucide-react";
import { useNovoBoleto } from "./novo-provider";

// Ações rápidas da tela inicial. A primeira (Novo boleto) abre direto no scanner.
// O envio manual de lembretes fica no menu "Mais" da barra inferior.
export default function Atalhos() {
  const { abrir } = useNovoBoleto();
  return (
    <nav className="atalhos" aria-label="Ações rápidas">
      <button className="atalho destaque" onClick={() => abrir(true)}>
        <span className="quadro"><ScanBarcode aria-hidden /></span>
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
