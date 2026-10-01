import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';
import { calcularINSS } from './inss.js';
import { calcularIRRF } from './irrf.js';

/**
 * Salário líquido mensal de um empregado CLT.
 * valeTransporte: custo mensal das passagens; o desconto é de até 6% do salário-base.
 */
export function calcularSalarioLiquido(
  { salarioBruto, dependentes = 0, pensao = 0, previdenciaPrivada = 0, valeTransporte = 0, outrosDescontos = 0 },
  tabelas = TABELAS,
) {
  const bruto = Math.max(0, salarioBruto);
  const inss = calcularINSS(bruto, tabelas);
  const irrf = calcularIRRF({ rendimento: bruto, inss: inss.valor, dependentes, pensao, previdenciaPrivada }, tabelas);
  const irrfSemReforma = calcularIRRF(
    { rendimento: bruto, inss: inss.valor, dependentes, pensao, previdenciaPrivada, aplicarReducao: false },
    tabelas,
  );
  const descontoVT = arred(Math.min(valeTransporte, bruto * 0.06));
  const totalDescontos = arred(inss.valor + irrf.imposto + pensao + previdenciaPrivada + descontoVT + outrosDescontos);
  const liquido = arred(bruto - totalDescontos);
  return {
    bruto: arred(bruto),
    inss,
    irrf,
    descontoVT,
    pensao: arred(pensao),
    previdenciaPrivada: arred(previdenciaPrivada),
    outrosDescontos: arred(outrosDescontos),
    totalDescontos,
    liquido,
    percentualLiquido: bruto > 0 ? liquido / bruto : 0,
    economiaReforma: arred(irrfSemReforma.imposto - irrf.imposto),
    fgts: arred(bruto * tabelas.fgts.aliquota),
  };
}
