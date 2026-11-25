// Datas tratadas como strings YYYY-MM-DD no fuso de Brasília.
export function hojeBR(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function horaBR(): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return Number(h) % 24;
}

export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(ate + "T00:00:00Z") - Date.parse(de + "T00:00:00Z")) / 86400000);
}

export function formatarData(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseReais(txt: string): number | null {
  const n = Number(txt.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export function somarMes(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function somarDias(iso: string, dias: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + dias * 86400000).toISOString().slice(0, 10);
}

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function mesCurto(mes: string): string {
  return MESES_CURTOS[Number(mes.slice(5, 7)) - 1];
}

export function formatarDataCurta(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${mesCurto(iso)}`;
}

export function rotuloMes(mes: string): string {
  return `${mesCurto(mes)[0].toUpperCase()}${mesCurto(mes).slice(1)} ${mes.slice(0, 4)}`;
}
