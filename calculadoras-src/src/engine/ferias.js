import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';
import { calcularINSS } from './inss.js';
import { calcularIRRF } from './irrf.js';

/**
 * Férias de empregado CLT.
 * diasGozo: dias de descanso (5 a 30). diasVendidos: abono pecuniário (até 1/3 do direito, máx. 10).
 * O abono pecuniário e seu 1/3 são isentos de INSS e IR.
 * adiantar13: recebe junto a 1ª parcela do 13º (50% do salário, sem descontos).
 */
export function calcularFerias(
  { salario, mediasAdicionais = 0, diasGozo = 30, diasVendidos = 0, dependentes = 0, pensao = 0, adiantar13 = false },
  tabelas = TABELAS,
) {
  const erros = [];
  const vendidos = Math.max(0, Math.min(10, diasVendidos));
  const gozo = Math.max(0, Math.min(30, diasGozo));
  if (gozo < 5) erros.push('Cada período de férias precisa ter pelo menos 5 dias.');
  if (gozo + vendidos > 30) erros.push('Dias de férias + dias vendidos não podem passar de 30.');
  if (diasVendidos > 10) erros.push('É possível vender no máximo 10 dias (1/3 das férias).');

  const remuneracao = Math.max(0, salario) + Math.max(0, mediasAdicionais);
  const valorDia = remuneracao / 30;
  const ferias = arred(valorDia * gozo);
  const terco = arred(ferias / 3);
  const abono = arred(valorDia * vendidos);
  const tercoAbono = arred(abono / 3);
  const tributavel = arred(ferias + terco);

  const inss = calcularINSS(tributavel, tabelas);
  const irrf = calcularIRRF({ rendimento: tributavel, inss: inss.valor, dependentes, pensao }, tabelas);
  const adiantamento13 = adiantar13 ? arred(Math.max(0, salario) / 2) : 0;

  const bruto = arred(tributavel + abono + tercoAbono + adiantamento13);
  const descontos = arred(inss.valor + irrf.imposto + pensao);
  return {
    erros,
    valorDia: arred(valorDia),
    ferias,
    terco,
    abono,
    tercoAbono,
    adiantamento13,
    bruto,
    inss,
    irrf,
    pensao: arred(pensao),
    descontos,
    liquido: arred(bruto - descontos),
  };
}
