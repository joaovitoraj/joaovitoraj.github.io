// Testes do motor de cálculo. Valores de referência conferidos em exemplos publicados
// (ex.: salário de R$ 6.000 → INSS R$ 641,51 e IR R$ 385,10 em 2026) ou calculados à mão.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TABELAS,
  tabelasVigentes,
  arred,
  paraNumero,
  calcularINSS,
  calcularINSSProLabore,
  calcularIRRF,
  calcularSalarioLiquido,
  calcularFerias,
  calcularDecimoTerceiro,
  calcularRescisao,
  calcularPJ,
  calcularCLTAnual,
  compararCltPj,
  aliquotaEfetivaSimples,
  gerarPixCopiaECola,
  crc16,
} from '../src/engine/index.js';

test('arred: meio para cima, sem ruído de ponto flutuante', () => {
  assert.equal(arred(1.005), 1.01);
  assert.equal(arred(46.605), 46.61);
  assert.equal(arred(564.85475), 564.85);
  assert.equal(arred(-1.005), -1.01);
  assert.equal(arred(NaN), 0);
});

test('paraNumero: formatos brasileiros', () => {
  assert.equal(paraNumero('5.000,50'), 5000.5);
  assert.equal(paraNumero('R$ 5.000'), 5000);
  assert.equal(paraNumero('5000.5'), 5000.5);
  assert.equal(paraNumero('1.234.567'), 1234567);
  assert.equal(paraNumero('3000'), 3000);
  assert.equal(paraNumero(''), 0);
  assert.equal(paraNumero('abc'), 0);
  assert.equal(paraNumero('-10'), 0);
  assert.equal(paraNumero(2500), 2500);
});

test('INSS 2026 progressivo', () => {
  assert.equal(calcularINSS(0).valor, 0);
  assert.equal(calcularINSS(3000).valor, 248.6);
  assert.equal(calcularINSS(6000).valor, 641.51);
  assert.equal(calcularINSS(7000).valor, 781.51);
  // Acima do teto o desconto é sempre o máximo.
  assert.equal(calcularINSS(10000).valor, 988.09);
  assert.equal(calcularINSS(50000).valor, 988.09);
  assert.ok(calcularINSS(10000).atingiuTeto);
  assert.equal(calcularINSS(6000).detalhes.length, 4);
});

test('INSS do pró-labore: 11% limitado ao teto', () => {
  assert.equal(calcularINSSProLabore(4200), 462);
  assert.equal(calcularINSSProLabore(20000), arred(8475.55 * 0.11));
});

test('IRRF 2026: exemplo publicado de R$ 6.000', () => {
  const ir = calcularIRRF({ rendimento: 6000, inss: 641.51 });
  assert.equal(ir.base, 5358.49);
  assert.equal(ir.impostoTabela, 564.85);
  assert.equal(ir.reducao, 179.75);
  assert.equal(ir.imposto, 385.1);
  assert.equal(ir.usaSimplificado, false);
});

test('IRRF 2026: isenção até R$ 5.000', () => {
  for (const r of [2000, 3036, 4000, 4999.99, 5000]) {
    const inss = calcularINSS(r).valor;
    assert.equal(calcularIRRF({ rendimento: r, inss }).imposto, 0, `rendimento ${r}`);
  }
  // Sem a reforma, R$ 5.000 pagariam o imposto cheio da tabela.
  const semReforma = calcularIRRF({ rendimento: 5000, inss: 501.51, aplicarReducao: false });
  assert.equal(semReforma.imposto, 312.89);
});

test('IRRF 2026: redução parcial entre R$ 5.000,01 e R$ 7.350 e nenhuma acima', () => {
  assert.equal(calcularIRRF({ rendimento: 7000, inss: 781.51 }).reducao, 46.61);
  assert.equal(calcularIRRF({ rendimento: 7000, inss: 781.51 }).imposto, 754.74);
  assert.equal(calcularIRRF({ rendimento: 7350, inss: 830.51 }).reducao, 0);
  assert.equal(calcularIRRF({ rendimento: 10000, inss: 988.09 }).imposto, 1569.55);
});

test('IRRF: dispensa de retenção até R$ 10 só no mensal, não no 13º', () => {
  const inss = calcularINSS(5010).valor;
  const mensal = calcularIRRF({ rendimento: 5010, inss });
  const decimo = calcularIRRF({ rendimento: 5010, inss, tipo: 'exclusiva' });
  assert.equal(mensal.imposto, 0);
  assert.equal(mensal.dispensado, true);
  assert.equal(decimo.imposto, 3.58);
});

test('IRRF: dependentes e desconto simplificado', () => {
  const sem = calcularIRRF({ rendimento: 9000, inss: calcularINSS(9000).valor });
  const com = calcularIRRF({ rendimento: 9000, inss: calcularINSS(9000).valor, dependentes: 2 });
  // Cada imposto é arredondado separadamente, então a diferença pode variar 1 centavo.
  assert.ok(Math.abs(sem.imposto - com.imposto - 2 * 189.59 * 0.275) <= 0.01);
  // Com deduções pequenas, vale o desconto simplificado de R$ 607,20.
  assert.equal(calcularIRRF({ rendimento: 5500, inss: 0 }).deducao, 607.2);
});

test('salário líquido', () => {
  const r = calcularSalarioLiquido({ salarioBruto: 6000 });
  assert.equal(r.liquido, 4973.39);
  assert.equal(r.economiaReforma, 179.75);
  assert.equal(r.fgts, 480);
  // Vale-transporte: desconta o custo, limitado a 6% do salário.
  assert.equal(calcularSalarioLiquido({ salarioBruto: 3000, valeTransporte: 400 }).descontoVT, 180);
  assert.equal(calcularSalarioLiquido({ salarioBruto: 3000, valeTransporte: 100 }).descontoVT, 100);
  assert.equal(calcularSalarioLiquido({ salarioBruto: 0 }).liquido, 0);
});

test('férias de 30 dias', () => {
  const r = calcularFerias({ salario: 3000 });
  assert.deepEqual(r.erros, []);
  assert.equal(r.ferias, 3000);
  assert.equal(r.terco, 1000);
  assert.equal(r.inss.valor, 368.6);
  assert.equal(r.irrf.imposto, 0);
  assert.equal(r.liquido, 3631.4);
});

test('férias com abono pecuniário: abono sem INSS e IR', () => {
  const r = calcularFerias({ salario: 6000, diasGozo: 20, diasVendidos: 10, adiantar13: true });
  assert.equal(r.abono, 2000);
  assert.equal(r.tercoAbono, 666.67);
  assert.equal(r.adiantamento13, 3000);
  assert.equal(r.inss.base, 5333.33);
  assert.equal(r.bruto, 11000);
});

test('férias: validações', () => {
  assert.ok(calcularFerias({ salario: 3000, diasGozo: 25, diasVendidos: 10 }).erros.length > 0);
  assert.ok(calcularFerias({ salario: 3000, diasGozo: 4 }).erros.length > 0);
});

test('13º salário', () => {
  const r = calcularDecimoTerceiro({ salario: 8000, meses: 12 });
  assert.equal(r.primeiraParcela, 4000);
  assert.equal(r.inss.valor, 921.51);
  assert.equal(r.irrf.imposto, 1037.85);
  assert.equal(r.segundaParcela, 2040.64);
  assert.equal(r.liquido, 6040.64);
  assert.equal(calcularDecimoTerceiro({ salario: 3000, meses: 6 }).bruto, 1500);
  assert.equal(calcularDecimoTerceiro({ salario: 3000, meses: 20 }).avos, 12);
});

test('rescisão sem justa causa com aviso indenizado', () => {
  const r = calcularRescisao({ salario: 3000, admissao: '2023-03-10', saida: '2026-09-25', tipo: 'semJustaCausa' });
  assert.deepEqual(r.erros, []);
  assert.equal(r.anosCompletos, 3);
  assert.equal(r.diasAvisoProporcional, 39);
  assert.equal(r.fimProjetado, '2026-11-03');
  assert.equal(r.diasSaldo, 25);
  assert.equal(r.avos13, 10);
  assert.equal(r.avosFerias, 8);
  const v = Object.fromEntries(r.itens.map((i) => [i.chave, i.valor]));
  assert.equal(v.saldo, 2500);
  assert.equal(v.aviso, 3900);
  assert.equal(v.decimo, 2500);
  assert.equal(v.feriasProporcionais, 2000);
  assert.equal(v.tercoProporcionais, 666.67);
  assert.equal(v.inssSaldo, 200.69);
  assert.equal(r.liquido, 11165.29);
  // FGTS estimado: 42 meses × 8% × R$ 3.000 × (1 + 1/12 + 1/36)
  assert.equal(r.fgts.saldo, 11200);
  assert.equal(r.fgts.depositoRescisorio, 712);
  assert.equal(r.fgts.multa, 4764.8);
  assert.equal(r.fgts.saque, 16676.8);
  assert.equal(r.seguroDesemprego, true);
});

test('rescisão: justa causa só recebe saldo e férias vencidas', () => {
  const r = calcularRescisao({
    salario: 3000,
    admissao: '2023-03-10',
    saida: '2026-09-25',
    tipo: 'justaCausa',
    feriasVencidas: 1,
  });
  assert.deepEqual(
    r.itens.filter((i) => i.natureza === 'provento').map((i) => i.chave),
    ['saldo', 'feriasVencidas', 'tercoVencidas'],
  );
  assert.equal(r.fgts.saque, 0);
  assert.equal(r.fgts.multa, 0);
});

test('rescisão: acordo paga metade do aviso, multa de 20% e saque de 80%', () => {
  const r = calcularRescisao({
    salario: 3000,
    admissao: '2023-03-10',
    saida: '2026-09-25',
    tipo: 'acordo',
    saldoFGTS: 10000,
  });
  assert.equal(r.diasIndenizados, 19.5);
  assert.equal(r.itens.find((i) => i.chave === 'aviso').valor, 1950);
  const base = 10000 + r.fgts.depositoRescisorio;
  assert.equal(r.fgts.multa, arred(base * 0.2));
  assert.equal(r.fgts.saque, arred(base * 0.8 + r.fgts.multa));
  assert.equal(r.fgts.saldoEstimado, false);
});

test('rescisão: pedido de demissão sem cumprir aviso desconta 30 dias', () => {
  const r = calcularRescisao({
    salario: 3000,
    admissao: '2023-03-10',
    saida: '2026-09-25',
    tipo: 'pedidoDemissao',
    aviso: 'naoCumprido',
  });
  assert.equal(r.itens.find((i) => i.chave === 'descontoAviso').valor, 3000);
  assert.equal(r.fgts.saque, 0);
  assert.equal(r.liquido, 3704.45);
});

test('rescisão: aviso trabalhado indeniza só os dias proporcionais extras', () => {
  const r = calcularRescisao({
    salario: 3000,
    admissao: '2023-03-10',
    saida: '2026-09-25',
    tipo: 'semJustaCausa',
    aviso: 'trabalhado',
  });
  assert.equal(r.diasIndenizados, 9);
  assert.equal(r.itens.find((i) => i.chave === 'aviso').valor, 900);
});

test('rescisão: mês inteiro conta 30 dias e projeção pode virar o ano', () => {
  const fev = calcularRescisao({ salario: 3000, admissao: '2020-01-01', saida: '2026-02-28', tipo: 'justaCausa' });
  assert.equal(fev.diasSaldo, 30);
  const dez = calcularRescisao({ salario: 3000, admissao: '2021-06-01', saida: '2026-12-20', tipo: 'semJustaCausa' });
  assert.equal(dez.diasAvisoProporcional, 45);
  assert.equal(dez.fimProjetado, '2027-02-03');
  assert.equal(dez.avos13, 13);
  // Admitido no mesmo mês da saída.
  const novo = calcularRescisao({ salario: 3000, admissao: '2026-09-10', saida: '2026-09-25', tipo: 'pedidoDemissao' });
  assert.equal(novo.diasSaldo, 16);
});

test('rescisão: saque-aniversário libera só a multa', () => {
  const r = calcularRescisao({
    salario: 3000,
    admissao: '2023-03-10',
    saida: '2026-09-25',
    tipo: 'semJustaCausa',
    saldoFGTS: 10000,
    saqueAniversario: true,
  });
  assert.equal(r.fgts.saqueSaldo, 0);
  assert.equal(r.fgts.saque, r.fgts.multa);
  assert.equal(r.fgts.multa, arred((10000 + r.fgts.depositoRescisorio) * 0.4));
});

test('rescisão: aviso proporcional limitado a 90 dias', () => {
  const r = calcularRescisao({ salario: 3000, admissao: '1990-01-01', saida: '2026-06-30', tipo: 'semJustaCausa' });
  assert.equal(r.diasAvisoProporcional, 90);
});

test('rescisão: validações de entrada', () => {
  assert.ok(calcularRescisao({ salario: 3000, admissao: '2026-02-31', saida: '2026-03-01' }).erros.length);
  assert.ok(calcularRescisao({ salario: 3000, admissao: '2026-05-01', saida: '2026-03-01' }).erros.length);
  assert.ok(calcularRescisao({ salario: 0, admissao: '2025-05-01', saida: '2026-03-01' }).erros.length);
});

test('Simples Nacional: alíquota efetiva', () => {
  assert.equal(aliquotaEfetivaSimples(180000, 'III'), 0.06);
  assert.equal(arred(aliquotaEfetivaSimples(360000, 'III'), 4), 0.086);
  assert.equal(aliquotaEfetivaSimples(100000, 'V'), 0.155);
});

test('PJ: Anexo III com Fator R', () => {
  const r = calcularPJ({ faturamentoMensal: 15000, contador: 300 });
  assert.equal(r.escolhido.regime, 'simplesIII');
  assert.equal(r.escolhido.proLabore, 4200);
  assert.equal(r.liquidoMensal, 13338);
  assert.equal(r.liquidoAnual, 160056);
  // Regime forçado e meses sem faturamento.
  assert.equal(calcularPJ({ faturamentoMensal: 15000, regime: 'simplesV' }).escolhido.regime, 'simplesV');
  const onze = calcularPJ({ faturamentoMensal: 15000, contador: 300, mesesFaturados: 11 });
  assert.equal(onze.liquidoAnual, arred(onze.liquidoMensal * 11 - 300));
});

test('PJ: avisos para alta renda e limite do Simples', () => {
  const r = calcularPJ({ faturamentoMensal: 450000 });
  assert.ok(r.avisos.some((a) => a.includes('limite do Simples')));
  assert.ok(r.cenarios.every((c) => c.regime === 'presumido'));
  assert.ok(calcularPJ({ faturamentoMensal: 80000 }).avisos.some((a) => a.includes('50 mil')));
});

test('CLT anual', () => {
  const r = calcularCLTAnual({ salario: 10000, beneficiosMensais: 1000 });
  assert.equal(r.liquidoMensal, 7442.36);
  assert.equal(r.feriasLiquidas, 9859.03);
  assert.equal(r.fgts, 10666.67);
  assert.equal(r.total, 121834.02);
});

test('CLT x PJ: valores de equilíbrio são consistentes', () => {
  const clt = { salario: 10000, beneficiosMensais: 1000 };
  const pj = { faturamentoMensal: 15000, contador: 300 };
  const c = compararCltPj({ clt, pj });
  assert.equal(c.vencedor, 'pj');
  assert.equal(c.diferencaAnual, arred(c.pj.liquidoAnual - c.clt.total));
  const noEquilibrio = calcularPJ({ ...pj, faturamentoMensal: c.pjEquilibrio }).liquidoAnual;
  assert.ok(Math.abs(noEquilibrio - c.clt.total) < 1, `PJ no equilíbrio: ${noEquilibrio}`);
  const cltEquivalente = calcularCLTAnual({ ...clt, salario: c.cltEquivalente }).total;
  assert.ok(Math.abs(cltEquivalente - c.pj.liquidoAnual) < 1, `CLT equivalente: ${cltEquivalente}`);
  // Entradas vazias não quebram.
  assert.doesNotThrow(() => compararCltPj({ clt: { salario: 0 }, pj: { faturamentoMensal: 0 } }));
});

test('Pix copia e cola: CRC16 e exemplo do manual do Banco Central', () => {
  assert.equal(crc16('123456789'), '29B1');
  const codigo = gerarPixCopiaECola({
    chave: '123e4567-e12b-12d1-a456-426655440000',
    nome: 'Fulano de Tal',
    cidade: 'BRASILIA',
  });
  assert.equal(
    codigo,
    '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
  );
  assert.throws(() => gerarPixCopiaECola({ chave: '', nome: 'x', cidade: 'y' }));
  assert.match(gerarPixCopiaECola({ chave: 'a@b.com', nome: 'João Araújo', cidade: 'Rio de Janeiro', valor: 10 }), /5911Joao Araujo/);
});

test('tabelas: vigência e consistência', () => {
  assert.equal(tabelasVigentes(new Date('2026-06-15T12:00:00Z')), true);
  assert.equal(tabelasVigentes(new Date('2027-01-02T12:00:00Z')), false);
  // As faixas precisam estar em ordem crescente.
  for (const faixas of [TABELAS.inss.faixas, TABELAS.irrf.faixas, TABELAS.simples.anexoIII, TABELAS.simples.anexoV]) {
    for (let i = 1; i < faixas.length; i++) assert.ok(faixas[i].ate > faixas[i - 1].ate);
  }
  assert.equal(TABELAS.inss.faixas.at(-1).ate, TABELAS.inss.teto);
});
