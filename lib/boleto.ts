// Interpreta código de barras (44 dígitos) ou linha digitável (47 = bancário, 48 = convênio/concessionária).
// Funções puras, sem dependências, para rodar no navegador e em testes.

export type BoletoLido = {
  linha: string; // linha digitável só com dígitos
  valorCentavos: number | null;
  vencimento: string | null; // YYYY-MM-DD
  /** Arrecadação de governo (prefeitura, órgão governamental, multa de trânsito): provável imposto. */
  governo?: boolean;
};

function mod10(s: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = s.length - 1; i >= 0; i--) {
    const p = Number(s[i]) * peso;
    soma += p > 9 ? p - 9 : p;
    peso = peso === 2 ? 1 : 2;
  }
  return (10 - (soma % 10)) % 10;
}

function mod11Convenio(s: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = s.length - 1; i >= 0; i--) {
    soma += Number(s[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  if (resto === 0 || resto === 1) return 0;
  if (resto === 10) return 1;
  return 11 - resto;
}

// Fator de vencimento: dias desde 07/10/1997. Em 22/02/2025 o fator voltou a 1000, então
// existem duas datas candidatas (ciclo de 9000 dias): escolhe a mais próxima de hoje.
function vencimentoPorFator(fator: number): string | null {
  if (fator === 0) return null;
  const base = Date.UTC(1997, 9, 7);
  const dia = 86400000;
  const a = base + fator * dia;
  const b = a + 9000 * dia;
  const agora = Date.now();
  const escolhido = Math.abs(a - agora) <= Math.abs(b - agora) ? a : b;
  return new Date(escolhido).toISOString().slice(0, 10);
}

function bancarioDeBarras(b: string): BoletoLido {
  const c1 = b.slice(0, 4) + b.slice(19, 24);
  const c2 = b.slice(24, 34);
  const c3 = b.slice(34, 44);
  const linha = c1 + mod10(c1) + c2 + mod10(c2) + c3 + mod10(c3) + b[4] + b.slice(5, 19);
  const valor = Number(b.slice(9, 19));
  return {
    linha,
    valorCentavos: valor > 0 ? valor : null,
    vencimento: vencimentoPorFator(Number(b.slice(5, 9))),
  };
}

function convenioDeBarras(b: string): BoletoLido {
  const mod = b[2] === "6" || b[2] === "7" ? mod10 : mod11Convenio;
  let linha = "";
  for (let i = 0; i < 44; i += 11) {
    const bloco = b.slice(i, i + 11);
    linha += bloco + mod(bloco);
  }
  // 3º dígito: 6 = valor efetivo (módulo 10), 7 = valor de referência (mod 10),
  //            8 = valor efetivo (módulo 11), 9 = valor de referência (mod 11).
  // Só 6 e 8 trazem o valor em reais nas posições 5-15 (11 dígitos, em centavos).
  const valor = b[2] === "6" || b[2] === "8" ? Number(b.slice(4, 15)) : 0;
  // 2º dígito = segmento: 1 prefeituras, 5 órgãos governamentais, 7 multas de trânsito.
  const governo = ["1", "5", "7"].includes(b[1]);
  return { linha, valorCentavos: valor > 0 ? valor : null, vencimento: null, governo };
}

function barrasDeLinha(l: string): string | null {
  if (l.length === 47) {
    const c1 = l.slice(0, 9), c2 = l.slice(10, 20), c3 = l.slice(21, 31);
    if (mod10(c1) !== Number(l[9]) || mod10(c2) !== Number(l[20]) || mod10(c3) !== Number(l[31])) return null;
    return c1.slice(0, 4) + l[32] + l.slice(33, 47) + c1.slice(4, 9) + c2 + c3;
  }
  if (l.length === 48) {
    const blocos = [0, 12, 24, 36].map((i) => l.slice(i, i + 11));
    const mod = l[2] === "6" || l[2] === "7" ? mod10 : mod11Convenio;
    if (blocos.some((bl, i) => mod(bl) !== Number(l[i * 12 + 11]))) return null;
    return blocos.join("");
  }
  return null;
}

/** Aceita barras (44) ou linha digitável (47/48), com ou sem pontos/espaços. Retorna null se inválido. */
export function lerBoleto(entrada: string): BoletoLido | null {
  const d = entrada.replace(/\D/g, "");
  if (d.length === 44) return d[0] === "8" ? convenioDeBarras(d) : bancarioDeBarras(d);
  if (d.length === 47 || d.length === 48) {
    const barras = barrasDeLinha(d);
    if (!barras) return null; // dígito verificador não bate: provável erro de leitura/digitação
    return d.length === 47 ? bancarioDeBarras(barras) : convenioDeBarras(barras);
  }
  return null;
}

/** Formata a linha digitável como no boleto impresso. */
export function formatarLinha(l: string): string {
  if (l.length === 47) {
    return `${l.slice(0, 5)}.${l.slice(5, 10)} ${l.slice(10, 15)}.${l.slice(15, 21)} ${l.slice(21, 26)}.${l.slice(26, 32)} ${l[32]} ${l.slice(33)}`;
  }
  if (l.length === 48) return [0, 12, 24, 36].map((i) => l.slice(i, i + 12)).join(" ");
  return l;
}
