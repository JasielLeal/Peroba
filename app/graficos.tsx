import { formatarReais, mesCurto } from "@/lib/datas";

export type Fatia = { rotulo: string; valor: number; cor: string; qtd: number };

/** Rosca em SVG puro. Cada fatia vira um arco com stroke-dasharray. */
export function Rosca({ fatias, centro, sub }: { fatias: Fatia[]; centro: string; sub: string }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <svg viewBox="0 0 140 140" className="rosca" role="img" aria-label={`Distribuição por tipo. ${fatias.map((f) => `${f.rotulo}: ${formatarReais(f.valor)}`).join("; ")}`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
      {total > 0 &&
        fatias
          .filter((f) => f.valor > 0)
          .map((f) => {
            const frac = f.valor / total;
            const gap = frac < 1 ? 2 : 0;
            const el = (
              <circle
                key={f.rotulo}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={f.cor}
                strokeWidth="16"
                strokeDasharray={`${Math.max(frac * c - gap, 0)} ${c}`}
                strokeDashoffset={-acumulado * c}
                transform="rotate(-90 70 70)"
              />
            );
            acumulado += frac;
            return el;
          })}
      <text x="70" y="68" textAnchor="middle" className="rosca-v">{centro}</text>
      <text x="70" y="84" textAnchor="middle" className="rosca-s">{sub}</text>
    </svg>
  );
}

/** Barras dos últimos meses; o mês selecionado fica em destaque. */
export function BarrasMeses({ dados, atual }: { dados: { mes: string; valor: number }[]; atual: string }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  return (
    <div className="barras" role="img" aria-label={`Evolução mensal. ${dados.map((d) => `${mesCurto(d.mes)}: ${formatarReais(d.valor)}`).join("; ")}`}>
      {dados.map((d) => {
        const ativo = d.mes === atual;
        return (
          <div key={d.mes} className={`col${ativo ? " ativo" : ""}`}>
            <span className="topo-val">{ativo && d.valor > 0 ? formatarReais(d.valor) : ""}</span>
            <div className="haste"><div style={{ height: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 4 : 0)}%` }} /></div>
            <span className="mes">{mesCurto(d.mes)}</span>
          </div>
        );
      })}
    </div>
  );
}
