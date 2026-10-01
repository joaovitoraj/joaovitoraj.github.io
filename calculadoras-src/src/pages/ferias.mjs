import { TABELAS } from '../engine/tabelas.js';
import { calcularFerias } from '../engine/ferias.js';
import { brl } from '../site/html.mjs';
import { campoDinheiro, campoInteiro, campoSelect, campoCheckbox, avancado } from '../site/campos.mjs';

const ano = TABELAS.ano;

export default {
  slug: 'ferias/',
  calculadora: 'ferias',
  migalha: 'Férias',
  titulo: `Calculadora de Férias ${ano} — valor líquido com 1/3, abono e descontos`,
  descricao: `Calcule o valor das suas férias em ${ano}: terço constitucional, venda de 10 dias (abono pecuniário), adiantamento do 13º, INSS e IR com a nova isenção até R$ 5 mil.`,
  h1: `Calculadora de férias ${ano}`,
  lead: 'Veja quanto você recebe antes de sair de férias: valor dos dias de descanso, terço constitucional, abono de quem vende 10 dias e os descontos de INSS e Imposto de Renda.',

  formulario: () => `
${campoDinheiro({ nome: 'salario', rotulo: 'Salário bruto mensal', obrigatorio: true, placeholder: 'Ex.: 4.000,00' })}
${campoSelect({
  nome: 'dias',
  rotulo: 'Dias de férias',
  valor: 30,
  opcoes: [30, 20, 15, 14, 10, 5].map((d) => ({ valor: d, rotulo: `${d} dias` })),
  ajuda: 'As férias podem ser divididas em até 3 períodos: um de pelo menos 14 dias e os outros de pelo menos 5.',
})}
${campoCheckbox({ nome: 'vender', rotulo: 'Vender 10 dias (abono pecuniário)', ajuda: 'Com a venda, sobram no máximo 20 dias de descanso.' })}
${campoCheckbox({ nome: 'adiantar', rotulo: 'Receber a 1ª parcela do 13º junto' })}
${avancado(
  'Médias e dependentes',
  `${campoDinheiro({ nome: 'medias', rotulo: 'Média de horas extras e adicionais', ajuda: 'Média mensal dos últimos 12 meses.' })}
${campoInteiro({ nome: 'dependentes', rotulo: 'Dependentes no IR', max: 20 })}`,
)}`,

  conteudo: () => {
    const ex = calcularFerias({ salario: 4000 });
    const venda = calcularFerias({ salario: 4000, diasGozo: 20, diasVendidos: 10 });
    return `
<section>
<h2>Como calcular o valor das férias</h2>
<ol>
<li><strong>Valor dos dias:</strong> (salário + médias) ÷ 30 × dias de descanso.</li>
<li><strong>Terço constitucional:</strong> um terço do valor dos dias de férias.</li>
<li><strong>Abono pecuniário:</strong> se você vender 10 dias, recebe esses dias com mais 1/3 — sem INSS e sem IR.</li>
<li><strong>Descontos:</strong> INSS e IR incidem sobre férias + 1/3, calculados separadamente do salário do mês e já com a isenção de ${ano} para valores até ${brl(5000)}.</li>
</ol>
</section>

<section>
<h2>Exemplo: salário de ${brl(4000)}</h2>
<p><strong>30 dias de descanso:</strong> férias de ${brl(ex.ferias)} + 1/3 de ${brl(ex.terco)} = ${brl(ex.ferias + ex.terco)}. Desconto de INSS de ${brl(ex.inss.valor)} e IR de ${brl(ex.irrf.imposto)}. Líquido: <strong>${brl(ex.liquido)}</strong>.</p>
<p><strong>20 dias + venda de 10:</strong> férias de ${brl(venda.ferias)} + 1/3 de ${brl(venda.terco)}, mais abono de ${brl(venda.abono)} + 1/3 de ${brl(venda.tercoAbono)}. Descontos de ${brl(venda.descontos)}. Líquido: <strong>${brl(venda.liquido)}</strong> — e você ainda recebe o salário dos 10 dias trabalhados no mês.</p>
</section>

<section>
<h2>Prazos e regras</h2>
<ul>
<li>As férias devem ser pagas até 2 dias antes do início do descanso (CLT, art. 145).</li>
<li>A empresa precisa avisar a data das férias com pelo menos 30 dias de antecedência.</li>
<li>O pedido para vender 10 dias deve ser feito até 15 dias antes do fim do período aquisitivo.</li>
<li>As férias não podem começar nos 2 dias que antecedem um feriado ou o descanso semanal.</li>
<li>Se a empresa não conceder as férias nos 12 meses seguintes ao período aquisitivo, deve pagá-las em dobro.</li>
</ul>
</section>`;
  },

  faq: [
    {
      p: 'Quando as férias devem ser pagas?',
      r: '<p>Até 2 dias antes do início das férias. O atraso pode gerar multa administrativa para a empresa, mas, desde a decisão do STF na ADPF 501 (2022), não obriga por si só o pagamento em dobro. O dobro é devido quando as férias não são concedidas no prazo.</p>',
    },
    {
      p: 'Vale a pena vender 10 dias de férias?',
      r: '<p>Financeiramente, sim: o abono e o seu terço são isentos de INSS e de IR, e você ainda recebe o salário pelos dias trabalhados. O custo é ter menos descanso.</p>',
    },
    {
      p: 'Posso dividir minhas férias?',
      r: '<p>Sim, em até 3 períodos, desde que você concorde. Um deles precisa ter pelo menos 14 dias, e os outros, no mínimo 5 dias cada.</p>',
    },
    {
      p: 'Tem desconto de IR nas férias?',
      r: `<p>Sim, sobre o valor das férias mais o terço, calculado à parte do salário do mês. Desde ${ano}, se esse valor for de até ${brl(5000)}, o imposto é zerado pela redução da Lei 15.270/2025.</p>`,
    },
    {
      p: 'Posso receber o 13º junto com as férias?',
      r: '<p>Sim. A primeira parcela do 13º (metade do salário) pode ser paga junto com as férias, se você pedir até janeiro do ano. Ela vem sem descontos.</p>',
    },
    {
      p: 'O que entra nas médias?',
      r: '<p>Horas extras, adicional noturno, comissões e outras verbas variáveis habituais. Calcula-se a média mensal do período aquisitivo e soma-se ao salário.</p>',
    },
  ],
};
