// Utilitários de valores monetários.

// Arredonda "meio para cima" em centavos, imune a ruído de ponto flutuante
// (ex.: 46.605 vira 46.61 mesmo que o float seja 46.60499999...).
export function arred(valor, casas = 2) {
  if (!Number.isFinite(valor)) return 0;
  const fator = 10 ** casas;
  const abs = Math.abs(valor);
  const r = Math.round(Number((abs * fator).toFixed(6))) / fator;
  return valor < 0 ? -r : r;
}

// Converte entrada numérica (número ou texto no formato brasileiro) em número >= 0.
// Aceita "5.000,50", "5000,5", "5000.50", "R$ 5.000" e "5.000" (milhar).
export function paraNumero(entrada) {
  if (typeof entrada === 'number') return Number.isFinite(entrada) && entrada > 0 ? entrada : 0;
  if (entrada == null) return 0;
  let s = String(entrada).replace(/[R$\s ]/g, '').replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function inteiro(entrada, { min = 0, max = Infinity } = {}) {
  const n = Math.floor(paraNumero(entrada));
  return Math.min(max, Math.max(min, n));
}
