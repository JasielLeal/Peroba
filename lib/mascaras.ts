// Máscaras de digitação. Funções puras, usadas nos formulários.

/** Valor em reais "estilo caixa": cada dígito entra pela direita, em centavos. "164952" -> "1.649,52". */
export function mascaraValor(texto: string): string {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11);
  if (!digitos) return "";
  return valorParaInput(Number(digitos));
}

/** Centavos -> "1.649,52". */
export function valorParaInput(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Aplica um molde de grupos ao texto, sem preencher o que ainda não foi digitado.
function aplicar(digitos: string, grupos: [number, string][]): string {
  let saida = "";
  let pos = 0;
  for (const [tamanho, separador] of grupos) {
    if (pos >= digitos.length) break;
    saida += digitos.slice(pos, pos + tamanho);
    pos += tamanho;
    if (pos < digitos.length) saida += separador;
  }
  return saida;
}

const BANCARIO: [number, string][] = [[5, "."], [5, " "], [5, "."], [6, " "], [5, "."], [6, " "], [1, " "], [14, ""]];
const CONVENIO: [number, string][] = [[12, " "], [12, " "], [12, " "], [12, ""]];

/** Linha digitável (47 bancário ou 48 arrecadação, que começa com 8) agrupada como no boleto. */
export function mascaraLinha(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  if (digitos.startsWith("8")) return aplicar(digitos.slice(0, 48), CONVENIO);
  return aplicar(digitos.slice(0, 47), BANCARIO);
}
