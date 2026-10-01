import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';
import { calcularINSSProLabore } from './inss.js';
import { calcularIRRF } from './irrf.js';
import { calcularSalarioLiquido } from './salario.js';
import { calcularFerias } from './ferias.js';
import { calcularDecimoTerceiro } from './decimo-terceiro.js';

export function aliquotaEfetivaSimples(receitaAnual, anexo, tabelas = TABELAS) {
  const faixas = anexo === 'III' ? tabelas.simples.anexoIII : tabelas.simples.anexoV;
  if (receitaAnual <= 0) return faixas[0].aliquota;
  const faixa = faixas.find((f) => receitaAnual <= f.ate) ?? faixas[faixas.length - 1];
  return (receitaAnual * faixa.aliquota - faixa.deducao) / receitaAnual;
}

function proLaboreLiquido(proLabore, dependentes, tabelas) {
  const inss = calcularINSSProLabore(proLabore, tabelas);
  const irrf = calcularIRRF({ rendimento: proLabore, inss, dependentes }, tabelas).imposto;
  return { inss, irrf };
}

/** Simples Nacional. anexo 'III' usa pró-labore de 28% do faturamento (Fator R); 'V' usa o salário mínimo. */
export function cenarioSimples(
  { faturamentoMensal, receitaAnual = faturamentoMensal * 12, anexo, dependentes = 0, custosFixos = 0 },
  tabelas = TABELAS,
) {
  const aliquota = aliquotaEfetivaSimples(receitaAnual, anexo, tabelas);
  const proLabore =
    anexo === 'III'
      ? Math.max(tabelas.salarioMinimo, Math.ceil(faturamentoMensal * tabelas.simples.fatorRMinimo * 100) / 100)
      : tabelas.salarioMinimo;
  const das = arred(faturamentoMensal * aliquota);
  const { inss, irrf } = proLaboreLiquido(proLabore, dependentes, tabelas);
  const impostos = arred(das + inss + irrf);
  return {
    regime: anexo === 'III' ? 'simplesIII' : 'simplesV',
    nome: anexo === 'III' ? 'Simples Nacional — Anexo III (Fator R)' : 'Simples Nacional — Anexo V',
    nomeCurto: anexo === 'III' ? 'Simples, Anexo III' : 'Simples, Anexo V',
    aliquotaEfetiva: aliquota,
    proLabore: arred(proLabore),
    itens: [
      { descricao: `DAS (${(aliquota * 100).toFixed(2).replace('.', ',')}% do faturamento)`, valor: das },
      { descricao: 'INSS do pró-labore (11%)', valor: inss },
      { descricao: 'IR sobre o pró-labore', valor: irrf },
    ],
    impostos,
    custosFixos: arred(custosFixos),
    liquido: arred(faturamentoMensal - impostos - custosFixos),
    elegivel: receitaAnual <= tabelas.simples.limiteAnual,
  };
}

/** Lucro Presumido para serviços, com pró-labore de um salário mínimo. */
export function cenarioPresumido({ faturamentoMensal, iss = 0.02, dependentes = 0, custosFixos = 0 }, tabelas = TABELAS) {
  const lp = tabelas.lucroPresumido;
  const lucroPresumido = faturamentoMensal * lp.presuncao;
  const irpj = arred(lucroPresumido * lp.irpj + Math.max(0, lucroPresumido - lp.limiteAdicionalMensal) * lp.adicionalIrpj);
  const csll = arred(lucroPresumido * lp.csll);
  const pisCofins = arred(faturamentoMensal * (lp.pis + lp.cofins));
  const valorIss = arred(faturamentoMensal * iss);
  const proLabore = tabelas.salarioMinimo;
  const { inss, irrf } = proLaboreLiquido(proLabore, dependentes, tabelas);
  const cpp = arred(proLabore * lp.cppPatronal);
  const impostos = arred(irpj + csll + pisCofins + valorIss + inss + irrf + cpp);
  return {
    regime: 'presumido',
    nome: 'Lucro Presumido',
    nomeCurto: 'Lucro Presumido',
    aliquotaEfetiva: faturamentoMensal > 0 ? (irpj + csll + pisCofins + valorIss) / faturamentoMensal : 0,
    proLabore,
    itens: [
      { descricao: 'IRPJ', valor: irpj },
      { descricao: 'CSLL', valor: csll },
      { descricao: 'PIS e Cofins', valor: pisCofins },
      { descricao: `ISS (${(iss * 100).toFixed(1).replace('.', ',')}%)`, valor: valorIss },
      { descricao: 'INSS do pró-labore (11% + 20% patronal)', valor: arred(inss + cpp) },
      { descricao: 'IR sobre o pró-labore', valor: irrf },
    ],
    impostos,
    custosFixos: arred(custosFixos),
    liquido: arred(faturamentoMensal - impostos - custosFixos),
    elegivel: true,
  };
}

/**
 * Ganho líquido como PJ. regime: 'auto' (escolhe o melhor), 'simplesIII', 'simplesV' ou 'presumido'.
 * mesesFaturados: meses com nota emitida no ano (ex.: 11 para tirar um mês de folga sem receber).
 * Custos fixos (contador e outros) são pagos nos 12 meses.
 */
export function calcularPJ(
  { faturamentoMensal, mesesFaturados = 12, regime = 'auto', contador = 0, outrosCustos = 0, iss = 0.02, dependentes = 0 },
  tabelas = TABELAS,
) {
  const fat = Math.max(0, faturamentoMensal);
  const meses = Math.max(1, Math.min(12, Math.round(mesesFaturados)));
  const custosFixos = contador + outrosCustos;
  // A faixa do Simples depende da receita bruta dos últimos 12 meses.
  const receitaAnual = fat * meses;
  const base = { faturamentoMensal: fat, receitaAnual, dependentes, custosFixos };
  const cenarios = [
    cenarioSimples({ ...base, anexo: 'III' }, tabelas),
    cenarioSimples({ ...base, anexo: 'V' }, tabelas),
    cenarioPresumido({ ...base, iss }, tabelas),
  ]
    .filter((c) => c.elegivel)
    .map((c) => ({ ...c, liquidoAnual: arred(c.liquido * meses - custosFixos * (12 - meses)) }));
  const escolhido =
    regime === 'auto'
      ? cenarios.reduce((a, b) => (b.liquidoAnual > a.liquidoAnual ? b : a))
      : cenarios.find((c) => c.regime === regime) ?? cenarios[0];

  const avisos = [];
  if (receitaAnual > tabelas.simples.limiteAnual) avisos.push('Faturamento acima do limite do Simples Nacional (R$ 4,8 milhões/ano).');
  else if (receitaAnual > tabelas.simples.sublimiteIss)
    avisos.push('Acima de R$ 3,6 milhões/ano o ISS é recolhido fora do Simples — confirme com um contador.');
  const lucroDistribuido = escolhido.liquido - escolhido.proLabore;
  if (lucroDistribuido > tabelas.altaRenda.dividendosMensaisSemRetencao)
    avisos.push('Lucros acima de R$ 50 mil/mês da mesma empresa têm retenção de 10% de IR (Lei 15.270/2025).');
  if (escolhido.liquidoAnual > tabelas.altaRenda.irpfmRendaAnual)
    avisos.push('Renda anual acima de R$ 600 mil pode pagar o imposto mínimo (IRPFM) na declaração.');

  return {
    faturamentoMensal: arred(fat),
    mesesFaturados: meses,
    receitaAnual: arred(receitaAnual),
    escolhido,
    cenarios,
    liquidoMensal: escolhido.liquido,
    liquidoAnual: escolhido.liquidoAnual,
    avisos,
  };
}

/**
 * Remuneração anual CLT em dinheiro: 11 salários líquidos + mês de férias com 1/3 + 13º,
 * mais FGTS (8% sobre 13,33 salários) e benefícios. plrAnual deve ser o valor líquido.
 */
export function calcularCLTAnual(
  {
    salario,
    dependentes = 0,
    beneficiosMensais = 0,
    plrAnual = 0,
    incluirFGTS = true,
    incluirMultaFGTS = false,
  },
  tabelas = TABELAS,
) {
  const s = Math.max(0, salario);
  const mensal = calcularSalarioLiquido({ salarioBruto: s, dependentes }, tabelas);
  const ferias = calcularFerias({ salario: s, diasGozo: 30, dependentes }, tabelas);
  const decimo = calcularDecimoTerceiro({ salario: s, meses: 12, dependentes }, tabelas);
  const salariosLiquidos = arred(mensal.liquido * 11 + ferias.liquido + decimo.liquido);
  const fgts = incluirFGTS ? arred(s * tabelas.fgts.aliquota * (13 + 1 / 3)) : 0;
  const multa = incluirFGTS && incluirMultaFGTS ? arred(fgts * tabelas.fgts.multaSemJustaCausa) : 0;
  const beneficios = arred(beneficiosMensais * 12 + plrAnual);
  const total = arred(salariosLiquidos + fgts + multa + beneficios);
  return {
    salario: arred(s),
    liquidoMensal: mensal.liquido,
    feriasLiquidas: ferias.liquido,
    decimoLiquido: decimo.liquido,
    salariosLiquidos,
    fgts,
    multa,
    beneficios,
    total,
    equivalenteMensal: arred(total / 12),
  };
}

// Busca binária genérica para funções crescentes.
function resolver(fn, alvo, max = 2_000_000) {
  if (alvo <= 0) return 0;
  let lo = 0;
  let hi = max;
  if (fn(hi) < alvo) return null;
  for (let i = 0; i < 60 && hi - lo > 0.005; i++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) >= alvo) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi * 100) / 100;
}

/** Compara uma vaga CLT com uma proposta PJ e calcula os valores de equilíbrio. */
export function compararCltPj({ clt, pj }, tabelas = TABELAS) {
  const resCLT = calcularCLTAnual(clt, tabelas);
  const resPJ = calcularPJ(pj, tabelas);
  const diferencaAnual = arred(resPJ.liquidoAnual - resCLT.total);
  const pjEquilibrio = resolver((f) => calcularPJ({ ...pj, faturamentoMensal: f }, tabelas).liquidoAnual, resCLT.total);
  const cltEquivalente = resolver((s) => calcularCLTAnual({ ...clt, salario: s }, tabelas).total, resPJ.liquidoAnual);
  return {
    clt: resCLT,
    pj: resPJ,
    diferencaAnual,
    diferencaMensal: arred(diferencaAnual / 12),
    diferencaPercentual: resCLT.total > 0 ? diferencaAnual / resCLT.total : 0,
    vencedor: Math.abs(diferencaAnual) < 1 ? 'empate' : diferencaAnual > 0 ? 'pj' : 'clt',
    pjEquilibrio,
    cltEquivalente,
  };
}
