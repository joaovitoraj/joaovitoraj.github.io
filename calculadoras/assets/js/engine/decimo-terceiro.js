import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';
import { calcularINSS } from './inss.js';
import { calcularIRRF } from './irrf.js';

/**
 * 13º salário. A 1ª parcela (até 30/11) é metade do valor bruto, sem descontos;
 * INSS e IR (tributação exclusiva) saem integralmente da 2ª parcela (até 20/12).
 * meses: meses trabalhados no ano (conta o mês com 15 dias ou mais).
 */
export function calcularDecimoTerceiro(
  { salario, mediasAdicionais = 0, meses = 12, dependentes = 0, pensao = 0 },
  tabelas = TABELAS,
) {
  const avos = Math.max(0, Math.min(12, Math.floor(meses)));
  const remuneracao = Math.max(0, salario) + Math.max(0, mediasAdicionais);
  const bruto = arred((remuneracao / 12) * avos);
  const primeiraParcela = arred(bruto / 2);
  const inss = calcularINSS(bruto, tabelas);
  const irrf = calcularIRRF({ rendimento: bruto, inss: inss.valor, dependentes, pensao, tipo: 'exclusiva' }, tabelas);
  const descontos = arred(inss.valor + irrf.imposto + pensao);
  const liquido = arred(bruto - descontos);
  return {
    avos,
    bruto,
    primeiraParcela,
    inss,
    irrf,
    pensao: arred(pensao),
    descontos,
    segundaParcela: arred(liquido - primeiraParcela),
    liquido,
    fgts: arred(bruto * tabelas.fgts.aliquota),
  };
}
