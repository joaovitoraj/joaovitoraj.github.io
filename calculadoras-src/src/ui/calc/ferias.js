import { calcularFerias } from '../../engine/index.js';
import { brl, linhasTabela } from '../ui.js';

// Quem vende 10 dias descansa no máximo 20.
export function aoMudar(form, d) {
  const select = form.elements.dias;
  for (const op of select.options) op.disabled = d.vender && Number(op.value) > 20;
  if (d.vender && Number(select.value) > 20) select.value = '20';
  d.dias = select.value;
}

export function calcular(d) {
  if (!d.salario) return null;
  return calcularFerias({
    salario: d.salario,
    mediasAdicionais: d.medias,
    diasGozo: Number(d.dias) || 30,
    diasVendidos: d.vender ? 10 : 0,
    dependentes: d.dependentes,
    adiantar13: d.adiantar,
  });
}

export function renderizar(r) {
  const linhas = [
    { rotulo: 'Férias', valor: r.ferias },
    { rotulo: '1/3 constitucional', valor: r.terco },
    r.abono > 0 && { rotulo: 'Abono pecuniário (10 dias)', detalhe: '(sem impostos)', valor: r.abono },
    r.tercoAbono > 0 && { rotulo: '1/3 sobre o abono', valor: r.tercoAbono },
    r.adiantamento13 > 0 && { rotulo: '1ª parcela do 13º', valor: r.adiantamento13 },
    { rotulo: 'INSS', valor: r.inss.valor, desconto: true, classe: 'desconto' },
    {
      rotulo: 'Imposto de Renda',
      detalhe: r.irrf.reducao > 0 ? `(com redução de ${brl(r.irrf.reducao)})` : '',
      valor: r.irrf.imposto,
      desconto: true,
      classe: 'desconto',
    },
    { rotulo: 'Total líquido', valor: r.liquido, classe: 'total' },
  ].filter(Boolean);
  return `
<div class="destaque">
<p class="destaque-rotulo">Você recebe antes das férias</p>
<p class="destaque-valor">${brl(r.liquido)}</p>
<p class="destaque-sub">Bruto de ${brl(r.bruto)} · descontos de ${brl(r.descontos)}</p>
</div>
<table class="tabela-resultado"><tbody>${linhasTabela(linhas)}</tbody></table>
<p class="nota">O pagamento deve cair até 2 dias antes do início das férias.${r.abono > 0 ? ' Os 10 dias vendidos são trabalhados e pagos também como salário normal do mês.' : ''}</p>`;
}

export function textoCompartilhar(r) {
  return `Minhas férias líquidas: ${brl(r.liquido)}. Calcule as suas:`;
}
