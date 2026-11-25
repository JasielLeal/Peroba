import { mesCurto, somarMes } from "@/lib/datas";

/** Opções do seletor de mês: 6 meses antes e 6 depois do mês atual (mais o escolhido, se fora da faixa). */
export function opcoesDeMes(mesAtual: string, escolhido: string) {
  const opcoes = Array.from({ length: 13 }, (_, i) => {
    const v = somarMes(mesAtual, i - 6);
    const cap = mesCurto(v)[0].toUpperCase() + mesCurto(v).slice(1);
    return { valor: v, rotulo: v.slice(0, 4) === mesAtual.slice(0, 4) ? cap : `${cap} ${v.slice(2, 4)}` };
  });
  if (!opcoes.some((o) => o.valor === escolhido)) opcoes.push({ valor: escolhido, rotulo: escolhido });
  return opcoes;
}

export function mesDoParametro(pedido: string | undefined, mesAtual: string): string {
  return pedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : mesAtual;
}
