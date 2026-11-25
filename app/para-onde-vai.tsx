import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PorCategoria } from "@/lib/analises";
import { CATEGORIAS } from "@/lib/categorias";
import { formatarReais } from "@/lib/datas";

const COR = { distribuidora: "#071d63", imposto: "#d90000", outros: "#9aa3bd" } as const;

// Versão compacta de "Para onde vai o dinheiro" para a tela inicial (detalhes em /analises).
export default function ParaOndeVai({ categorias, mes }: { categorias: PorCategoria[]; mes: string }) {
  const total = categorias.reduce((s, c) => s + c.valor, 0);
  return (
    <section className="cartao compacto-card" aria-label="Para onde vai o dinheiro">
      <div className="secao">
        <h2>Para onde vai o dinheiro</h2>
        <Link href={`/analises?mes=${mes}`}>Detalhes <ArrowRight aria-hidden /></Link>
      </div>
      {total === 0 ? (
        <p className="nota">Sem boletos neste mês.</p>
      ) : (
        <>
          <div className="faixa" role="img" aria-label={categorias.map((c) => `${CATEGORIAS.find((x) => x.id === c.categoria)!.rotulo} ${Math.round((c.valor / total) * 100)}%`).join(", ")}>
            {categorias.filter((c) => c.valor > 0).map((c) => (
              <div key={c.categoria} style={{ width: `${(c.valor / total) * 100}%`, background: COR[c.categoria] }} />
            ))}
          </div>
          <ul className="mini-legenda">
            {categorias.map((c) => (
              <li key={c.categoria}>
                <span><i style={{ background: COR[c.categoria] }} />{CATEGORIAS.find((x) => x.id === c.categoria)!.rotulo}</span>
                <b>{formatarReais(c.valor)}</b>
                <small>{Math.round((c.valor / total) * 100)}%</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
