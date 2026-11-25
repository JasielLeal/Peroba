"use client";

import Link from "next/link";
import { useState } from "react";
import { ChartPie, CircleCheck, Ellipsis, House, LogOut, Plus } from "lucide-react";
import { sair } from "./actions";
import LembretesBotao from "./lembretes-botao";
import { useNovoBoleto } from "./novo-provider";

type Aba = "inicio" | "analises" | "pagos" | "estoque";

export default function Barra({ ativo }: { ativo: Aba }) {
  const { abrir } = useNovoBoleto();
  const [mais, setMais] = useState(false);

  const link = (aba: Aba, href: string, rotulo: string, Icone: typeof House) => (
    <Link href={href} className={`item${ativo === aba ? " ativo" : ""}`} aria-current={ativo === aba ? "page" : undefined}>
      <Icone aria-hidden />
      {rotulo}
    </Link>
  );

  return (
    <>
      {mais && (
        <div className="folha-fundo" onClick={(e) => e.target === e.currentTarget && setMais(false)}>
          <div className="folha" role="dialog" aria-modal="true" aria-label="Mais opções">
            <div className="cab">
              <h2>Mais</h2>
            </div>
            <div className="lista-menu">
              <LembretesBotao />
              <form action={sair}>
                <button>
                  <LogOut className="i" aria-hidden /> Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className="barra">
        <nav aria-label="Navegação principal">
          {link("inicio", "/", "Início", House)}
          {link("analises", "/analises", "Análises", ChartPie)}
          <button className="central" onClick={() => abrir(true)} aria-label="Novo boleto (escanear)">
            <Plus aria-hidden />
          </button>
          {link("pagos", "/pagos", "Pagos", CircleCheck)}
          <button className="item" onClick={() => setMais(true)}>
            <Ellipsis aria-hidden />
            Mais
          </button>
        </nav>
      </div>
    </>
  );
}
