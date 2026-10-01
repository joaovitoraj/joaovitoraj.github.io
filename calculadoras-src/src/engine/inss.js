import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';

// INSS do empregado (CLT), progressivo por faixas e limitado ao teto.
export function calcularINSS(salarioContribuicao, tabelas = TABELAS) {
  const { faixas, teto } = tabelas.inss;
  const bruto = Math.max(0, salarioContribuicao);
  const base = Math.min(bruto, teto);
  let anterior = 0;
  let total = 0;
  const detalhes = [];
  for (const faixa of faixas) {
    if (base <= anterior) break;
    const parcela = Math.min(base, faixa.ate) - anterior;
    const valor = parcela * faixa.aliquota;
    detalhes.push({ de: anterior, ate: faixa.ate, aliquota: faixa.aliquota, parcela: arred(parcela), valor: arred(valor) });
    total += valor;
    anterior = faixa.ate;
  }
  const valor = arred(total);
  return {
    base: arred(base),
    valor,
    atingiuTeto: bruto >= teto,
    aliquotaEfetiva: bruto > 0 ? valor / bruto : 0,
    detalhes,
  };
}

// INSS de sócio sobre pró-labore (contribuinte individual): 11% até o teto.
export function calcularINSSProLabore(proLabore, tabelas = TABELAS) {
  const base = Math.min(Math.max(0, proLabore), tabelas.inss.teto);
  return arred(base * tabelas.inssContribuinteIndividual);
}
