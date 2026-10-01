import { calcularSalarioLiquido, TABELAS } from '../../engine/index.js';
import { brl, pct, barraComposicao, linhasTabela } from '../ui.js';

export function calcular(d) {
  if (!d.salario) return null;
  return calcularSalarioLiquido({
    salarioBruto: d.salario,
    dependentes: d.dependentes,
    pensao: d.pensao,
    previdenciaPrivada: d.previdencia,
    valeTransporte: d.vt,
    outrosDescontos: d.outros,
  });
}

export function renderizar(r) {
  const outros = r.descontoVT + r.pensao + r.previdenciaPrivada + r.outrosDescontos;
  const ir = r.irrf;
  const detalheIR = ir.reducao > 0 ? `(${brl(ir.impostoTabela)} da tabela − ${brl(ir.reducao)} de redução)` : ir.imposto === 0 ? '(isento)' : '';
  const linhas = [
    { rotulo: 'Salário bruto', valor: r.bruto },
    { rotulo: 'INSS', detalhe: `(${pct(r.inss.aliquotaEfetiva)} efetivo)`, valor: r.inss.valor, desconto: true, classe: 'desconto' },
    { rotulo: 'Imposto de Renda', detalhe: detalheIR, valor: ir.imposto, desconto: true, classe: 'desconto' },
    r.descontoVT > 0 && { rotulo: 'Vale-transporte', valor: r.descontoVT, desconto: true, classe: 'desconto' },
    r.pensao > 0 && { rotulo: 'Pensão alimentícia', valor: r.pensao, desconto: true, classe: 'desconto' },
    r.previdenciaPrivada > 0 && { rotulo: 'Previdência privada', valor: r.previdenciaPrivada, desconto: true, classe: 'desconto' },
    r.outrosDescontos > 0 && { rotulo: 'Outros descontos', valor: r.outrosDescontos, desconto: true, classe: 'desconto' },
    { rotulo: 'Salário líquido', valor: r.liquido, classe: 'total' },
  ].filter(Boolean);

  const deducao = ir.usaSimplificado
    ? `desconto simplificado de ${brl(ir.deducao)} (maior que as deduções legais de ${brl(ir.deducoesLegais)})`
    : `deduções legais de ${brl(ir.deducao)} (INSS${r.pensao ? ', pensão' : ''}${r.previdenciaPrivada ? ', previdência' : ''} e dependentes)`;

  return `
<div class="destaque">
<p class="destaque-rotulo">Salário líquido</p>
<p class="destaque-valor">${brl(r.liquido)}</p>
<p class="destaque-sub">${pct(r.percentualLiquido)} do salário bruto</p>
</div>
${r.economiaReforma > 0 ? `<p class="selo-positivo">Com a isenção de ${TABELAS.ano}, você paga ${brl(r.economiaReforma)} a menos de IR por mês.</p>` : ''}
${barraComposicao(
  [
    { rotulo: 'Líquido', valor: r.liquido, classe: 's1' },
    { rotulo: 'INSS', valor: r.inss.valor, classe: 's2' },
    { rotulo: 'IR', valor: ir.imposto, classe: 's3' },
    { rotulo: 'Outros descontos', valor: outros, classe: 's4' },
  ],
  'Para onde vai o salário bruto',
)}
<table class="tabela-resultado"><tbody>${linhasTabela(linhas)}</tbody></table>
<details class="memoria"><summary>Ver a conta passo a passo</summary>
<ol>
<li>INSS progressivo sobre ${brl(r.inss.base)}: ${r.inss.detalhes.map((f) => `${brl(f.parcela)} × ${pct(f.aliquota)}`).join(' + ')} = <strong>${brl(r.inss.valor)}</strong>${r.inss.atingiuTeto ? ' (teto)' : ''}.</li>
<li>Base do IR: ${brl(r.bruto)} − ${deducao} = <strong>${brl(ir.base)}</strong>.</li>
<li>IR pela tabela (alíquota de ${pct(ir.aliquota)}): <strong>${brl(ir.impostoTabela)}</strong>.</li>
<li>Redução da Lei 15.270/2025: <strong>${brl(ir.reducao)}</strong>${ir.dispensado ? '. O valor que sobrou é de até R$ 10 e não é retido' : ''}.</li>
<li>IR a pagar: <strong>${brl(ir.imposto)}</strong>.</li>
</ol>
</details>
<p class="nota">FGTS: a empresa deposita ${brl(r.fgts)} por mês na sua conta, sem descontar do salário.</p>`;
}

export function textoCompartilhar(r) {
  return `Salário bruto de ${brl(r.bruto)} vira ${brl(r.liquido)} líquido em ${TABELAS.ano}. Calcule o seu:`;
}
