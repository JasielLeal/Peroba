"use client";

import { useRouter } from "next/navigation";

export default function SeletorMes({
  atual,
  opcoes,
  rota = "/",
}: {
  atual: string;
  opcoes: { valor: string; rotulo: string }[];
  rota?: string;
}) {
  const router = useRouter();
  return (
    <select aria-label="Mês" value={atual} onChange={(e) => router.replace(`${rota}?mes=${e.target.value}`)}>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>{o.rotulo}</option>
      ))}
    </select>
  );
}
