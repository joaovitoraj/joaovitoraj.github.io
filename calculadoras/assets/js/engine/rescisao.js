import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';
import { calcularINSS } from './inss.js';
import { calcularIRRF } from './irrf.js';
import { parseData, formatarISO, addDias, addMeses, diasInclusivos, diasNoMes, anosCompletos, mesesCompletos } from './datas.js';

export const TIPOS_RESCISAO = {
  semJustaCausa: 'Demissão sem justa causa',
  pedidoDemissao: 'Pedido de demissão',
  acordo: 'Acordo entre as partes (art. 484-A)',
  justaCausa: 'Demissão por justa causa',
  fimExperiencia: 'Fim do contrato de experiência',
};

// Opções de aviso prévio válidas para cada tipo de rescisão.
export const AVISOS_POR_TIPO = {
  semJustaCausa: ['indenizado', 'trabalhado'],
  pedidoDemissao: ['trabalhado', 'dispensado', 'naoCumprido'],
  acordo: ['indenizado', 'trabalhado'],
  justaCausa: [],
  fimExperiencia: [],
};

// Dias de saldo de salário no mês da saída (mês comercial de 30 dias).
export function diasSaldoSalario(admissao, saida) {
  const ano = saida.getUTCFullYear();
  const mes = saida.getUTCMonth();
  const inicioMes = new Date(Date.UTC(ano, mes, 1));
  const inicio = admissao > inicioMes ? admissao : inicioMes;
  const mesInteiro = inicio.getTime() === inicioMes.getTime() && saida.getUTCDate() === diasNoMes(ano, mes);
  if (mesInteiro) return 30;
  return Math.min(30, diasInclusivos(inicio, saida));
}

// Avos de 13º: meses (com 15+ dias trabalhados) desde janeiro do ano da saída
// — ou da admissão, se posterior — até o fim do contrato projetado pelo aviso.
export function avosDecimoTerceiro(admissao, saida, fimProjetado) {
  const inicioAno = new Date(Date.UTC(saida.getUTCFullYear(), 0, 1));
  const inicio = admissao > inicioAno ? admissao : inicioAno;
  let avos = 0;
  let ano = inicio.getUTCFullYear();
  let mes = inicio.getUTCMonth();
  for (;;) {
    const ini = new Date(Date.UTC(ano, mes, 1));
    if (ini > fimProjetado) break;
    const fimMes = new Date(Date.UTC(ano, mes, diasNoMes(ano, mes)));
    const a = inicio > ini ? inicio : ini;
    const b = fimProjetado < fimMes ? fimProjetado : fimMes;
    if (b >= a && diasInclusivos(a, b) >= 15) avos++;
    mes++;
    if (mes === 12) {
      mes = 0;
      ano++;
    }
  }
  return avos;
}

// Avos de férias proporcionais do período aquisitivo em curso (fração de 15+ dias conta um mês).
export function avosFeriasProporcionais(admissao, fim) {
  const anos = anosCompletos(admissao, fim);
  const inicioPeriodo = addMeses(admissao, 12 * anos);
  if (inicioPeriodo > fim) return 0;
  const meses = mesesCompletos(inicioPeriodo, fim);
  const restoInicio = addMeses(inicioPeriodo, meses);
  const resto = restoInicio <= fim ? diasInclusivos(restoInicio, fim) : 0;
  return Math.min(12, meses + (resto >= 15 ? 1 : 0));
}

/**
 * Rescisão de contrato CLT (estimativa das verbas e do FGTS).
 * saida: último dia trabalhado (no aviso trabalhado, o último dia do aviso).
 * feriasVencidas: períodos aquisitivos completos cujas férias não foram tiradas.
 * saldoFGTS: saldo atual da conta; se vazio, é estimado pelo tempo de casa.
 * saqueAniversario: quem optou pelo saque-aniversário não saca o saldo na demissão, só a multa
 * (Lei 8.036/1990, art. 20-D, incluído pela Lei 13.932/2019).
 */
export function calcularRescisao(
  {
    salario,
    mediasAdicionais = 0,
    admissao,
    saida,
    tipo = 'semJustaCausa',
    aviso = 'indenizado',
    feriasVencidas = 0,
    saldoFGTS = null,
    saqueAniversario = false,
    dependentes = 0,
  },
  tabelas = TABELAS,
) {
  const erros = [];
  const dAdm = parseData(admissao);
  const dSai = parseData(saida);
  if (!dAdm) erros.push('Informe uma data de admissão válida.');
  if (!dSai) erros.push('Informe uma data de saída válida.');
  if (dAdm && dSai && dSai < dAdm) erros.push('A data de saída não pode ser anterior à admissão.');
  if (!TIPOS_RESCISAO[tipo]) erros.push('Tipo de rescisão inválido.');
  if (!(salario > 0)) erros.push('Informe o salário.');
  if (erros.length) return { erros };

  const opcoesAviso = AVISOS_POR_TIPO[tipo];
  const avisoUsado = opcoesAviso.includes(aviso) ? aviso : opcoesAviso[0] ?? null;
  const rem = salario + Math.max(0, mediasAdicionais);
  const valorDia = rem / 30;
  const anos = anosCompletos(dAdm, dSai);
  const diasAvisoProporcional = Math.min(90, 30 + 3 * anos);

  // Aviso prévio: dias pagos como indenização e dias que projetam o contrato.
  let diasIndenizados = 0;
  let descontoAviso = 0;
  if (tipo === 'semJustaCausa') {
    // No aviso trabalhado, a pessoa trabalha 30 dias e os dias proporcionais extras são indenizados.
    diasIndenizados = avisoUsado === 'indenizado' ? diasAvisoProporcional : diasAvisoProporcional - 30;
  } else if (tipo === 'acordo' && avisoUsado === 'indenizado') {
    diasIndenizados = diasAvisoProporcional / 2;
  } else if (tipo === 'pedidoDemissao' && avisoUsado === 'naoCumprido') {
    descontoAviso = arred(rem);
  }
  const valorAviso = arred(valorDia * diasIndenizados);
  const fimProjetado = addDias(dSai, Math.floor(diasIndenizados));

  const diasSaldo = diasSaldoSalario(dAdm, dSai);
  const saldoSalario = arred(valorDia * diasSaldo);

  const perdeProporcionais = tipo === 'justaCausa';
  const avos13 = perdeProporcionais ? 0 : avosDecimoTerceiro(dAdm, dSai, fimProjetado);
  const decimo = arred((rem / 12) * avos13);

  const periodosAteSaida = anosCompletos(dAdm, dSai);
  // Período aquisitivo que se completa durante a projeção do aviso conta como 12/12.
  const periodosNaProjecao = anosCompletos(dAdm, fimProjetado) - periodosAteSaida;
  const avosFerias = perdeProporcionais ? 0 : periodosNaProjecao * 12 + avosFeriasProporcionais(dAdm, fimProjetado);
  const vencidas = Math.max(0, Math.min(2, Math.floor(feriasVencidas)));
  const feriasVenc = arred(rem * vencidas);
  const tercoVenc = arred(feriasVenc / 3);
  const feriasProp = arred((rem / 12) * avosFerias);
  const tercoProp = arred(feriasProp / 3);

  // Saldo de salário e 13º sofrem INSS e IR (o 13º separadamente). Aviso indenizado e
  // férias indenizadas são verbas indenizatórias: sem INSS e sem IR.
  const inssSaldo = calcularINSS(saldoSalario, tabelas);
  const irrfSaldo = calcularIRRF({ rendimento: saldoSalario, inss: inssSaldo.valor, dependentes }, tabelas);
  const inss13 = calcularINSS(decimo, tabelas);
  const irrf13 = calcularIRRF({ rendimento: decimo, inss: inss13.valor, dependentes, tipo: 'exclusiva' }, tabelas);

  const itens = [
    { chave: 'saldo', descricao: `Saldo de salário (${diasSaldo} dias)`, valor: saldoSalario, natureza: 'provento' },
    valorAviso > 0 && {
      chave: 'aviso',
      descricao: `Aviso prévio indenizado (${String(diasIndenizados).replace('.', ',')} dias)`,
      valor: valorAviso,
      natureza: 'provento',
    },
    avos13 > 0 && {
      chave: 'decimo',
      descricao: avos13 > 12 ? `13º salário (${avos13} avos, com a projeção do aviso)` : `13º salário proporcional (${avos13}/12)`,
      valor: decimo,
      natureza: 'provento',
    },
    vencidas > 0 && {
      chave: 'feriasVencidas',
      descricao: `Férias vencidas (${vencidas} período${vencidas > 1 ? 's' : ''})`,
      valor: feriasVenc,
      natureza: 'provento',
    },
    vencidas > 0 && { chave: 'tercoVencidas', descricao: '1/3 sobre férias vencidas', valor: tercoVenc, natureza: 'provento' },
    avosFerias > 0 && {
      chave: 'feriasProporcionais',
      descricao:
        avosFerias > 12 ? `Férias (${avosFerias} avos, com a projeção do aviso)` : `Férias proporcionais (${avosFerias}/12)`,
      valor: feriasProp,
      natureza: 'provento',
    },
    avosFerias > 0 && { chave: 'tercoProporcionais', descricao: '1/3 sobre férias proporcionais', valor: tercoProp, natureza: 'provento' },
    inssSaldo.valor > 0 && { chave: 'inssSaldo', descricao: 'INSS sobre saldo de salário', valor: inssSaldo.valor, natureza: 'desconto' },
    irrfSaldo.imposto > 0 && { chave: 'irrfSaldo', descricao: 'IR sobre saldo de salário', valor: irrfSaldo.imposto, natureza: 'desconto' },
    inss13.valor > 0 && { chave: 'inss13', descricao: 'INSS sobre 13º', valor: inss13.valor, natureza: 'desconto' },
    irrf13.imposto > 0 && { chave: 'irrf13', descricao: 'IR sobre 13º', valor: irrf13.imposto, natureza: 'desconto' },
    descontoAviso > 0 && { chave: 'descontoAviso', descricao: 'Aviso prévio não cumprido', valor: descontoAviso, natureza: 'desconto' },
  ].filter(Boolean);

  const proventos = arred(itens.filter((i) => i.natureza === 'provento').reduce((s, i) => s + i.valor, 0));
  const descontos = arred(itens.filter((i) => i.natureza === 'desconto').reduce((s, i) => s + i.valor, 0));
  const liquido = arred(Math.max(0, proventos - descontos));

  // FGTS: depósito do mês/rescisão incide sobre saldo, 13º e aviso indenizado (não sobre férias indenizadas).
  const meses = mesesCompletos(dAdm, dSai);
  const saldoInformado = saldoFGTS != null && saldoFGTS !== '' && Number(saldoFGTS) >= 0;
  const saldoBase = saldoInformado
    ? arred(Number(saldoFGTS))
    : arred(tabelas.fgts.aliquota * rem * meses * (1 + 1 / 12 + 1 / 36));
  const depositoRescisorio = arred(tabelas.fgts.aliquota * (saldoSalario + decimo + valorAviso));
  const baseMulta = arred(saldoBase + depositoRescisorio);
  const pctMulta = { semJustaCausa: tabelas.fgts.multaSemJustaCausa, acordo: tabelas.fgts.multaAcordo }[tipo] ?? 0;
  const pctSaque = { semJustaCausa: 1, acordo: tabelas.fgts.saqueAcordo, fimExperiencia: 1 }[tipo] ?? 0;
  const multa = arred(baseMulta * pctMulta);
  const saqueSaldo = saqueAniversario ? 0 : arred(baseMulta * pctSaque);
  const saque = arred(saqueSaldo + multa);

  return {
    erros: [],
    tipo,
    tipoNome: TIPOS_RESCISAO[tipo],
    aviso: avisoUsado,
    anosCompletos: anos,
    periodosCompletos: periodosAteSaida,
    diasAvisoProporcional,
    diasIndenizados,
    fimProjetado: formatarISO(fimProjetado),
    diasSaldo,
    avos13,
    avosFerias,
    itens,
    proventos,
    descontos,
    liquido,
    fgts: {
      saldoEstimado: !saldoInformado,
      saldo: saldoBase,
      depositoRescisorio,
      multaPercentual: pctMulta,
      multa,
      saquePercentual: saqueAniversario ? 0 : pctSaque,
      saqueAniversario: Boolean(saqueAniversario),
      saqueSaldo,
      saque,
    },
    seguroDesemprego: tipo === 'semJustaCausa',
    totalAReceber: arred(liquido + saque),
  };
}
