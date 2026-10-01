import { calcularDecimoTerceiro, TABELAS } from '../../engine/index.js';
import { brl, linhasTabela } from '../ui.js';

export function calcular(d) {
  if (!d.salario) return null;
  return calcularDecimoTerceiro({
    salario: d.salario,
    mediasAdicionais: d.medias,
    meses: Number(d.meses) || 12,
    dependentes: d.dependentes,
  });
}

export function renderizar(r) {
  const linhas = [
    { rotulo: `13º bruto (${r.avos}/12)`, valor: r.bruto },
    { rotulo: 'INSS', valor: r.inss.valor, desconto: true, classe: 'desconto' },
    {
      rotulo: 'Imposto de Renda',
      detalhe: r.irrf.reducao > 0 ? `(com redução de ${brl(r.irrf.reducao)})` : '',
      valor: r.irrf.imposto,
      desconto: true,
      classe: 'desconto',
    },
    { rotulo: 'Total líquido', valor: r.liquido, classe: 'total' },
  ];
  return `
<div class="destaque">
<p class="destaque-rotulo">13º salário líquido</p>
<p class="destaque-valor">${brl(r.liquido)}</p>
<p class="destaque-sub">Em duas parcelas</p>
</div>
<div class="parcelas">
<div class="parcela"><p class="parcela-rotulo">1ª parcela · até 30/11</p><p class="parcela-valor">${brl(r.primeiraParcela)}</p><p class="mudo">Sem descontos</p></div>
<div class="parcela"><p class="parcela-rotulo">2ª parcela · até 20/12</p><p class="parcela-valor">${brl(r.segundaParcela)}</p><p class="mudo">Já com INSS e IR</p></div>
</div>
<table class="tabela-resultado"><tbody>${linhasTabela(linhas)}</tbody></table>
<p class="nota">FGTS: a empresa deposita mais ${brl(r.fgts)} sobre o 13º.</p>`;
}

export function textoCompartilhar(r) {
  return `Meu 13º de ${TABELAS.ano}: ${brl(r.primeiraParcela)} na 1ª parcela e ${brl(r.segundaParcela)} na 2ª. Calcule o seu:`;
}
