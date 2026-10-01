import { TABELAS } from '../engine/tabelas.js';
import { calcularSalarioLiquido } from '../engine/salario.js';
import { brl, tabelaINSS, tabelaIRRF } from '../site/html.mjs';

const ano = TABELAS.ano;

const CARTOES = [
  {
    slug: 'salario-liquido/',
    titulo: 'Salário líquido',
    texto: `Quanto cai na conta depois do INSS e do IR, já com a isenção de ${ano} para quem ganha até R$ 5 mil.`,
  },
  {
    slug: 'clt-x-pj/',
    titulo: 'CLT x PJ',
    texto: 'Compare uma vaga CLT com uma proposta PJ e descubra quanto cobrar para não sair perdendo.',
  },
  {
    slug: 'rescisao/',
    titulo: 'Rescisão',
    texto: 'Verbas, aviso prévio proporcional, multa e saque do FGTS em cada tipo de saída.',
  },
  { slug: 'ferias/', titulo: 'Férias', texto: 'Valor das férias com 1/3, venda de 10 dias e adiantamento do 13º.' },
  {
    slug: 'decimo-terceiro/',
    titulo: '13º salário',
    texto: 'Valor da 1ª e da 2ª parcela, com descontos e proporcional aos meses trabalhados.',
  },
];

export default {
  slug: '',
  titulo: `Calculadoras de Salário, CLT e PJ ${ano} — grátis e atualizadas`,
  descricao: `Calculadoras trabalhistas grátis e atualizadas para ${ano}: salário líquido com a isenção do IR até R$ 5 mil, CLT x PJ, rescisão, férias e 13º salário. Sem cadastro.`,
  h1: `Calculadoras de salário, CLT e PJ ${ano}`,
  lead: `Contas trabalhistas sem enrolação, com as tabelas oficiais de ${ano} — incluindo a nova isenção do Imposto de Renda para quem ganha até R$ 5.000. Grátis, sem cadastro e direto no seu navegador.`,

  conteudo: (ctx) => {
    const cinco = calcularSalarioLiquido({ salarioBruto: 5000 });
    return `
<ul class="cartoes">
${CARTOES.map((c) => `<li><a class="cartao" href="${ctx.base}${c.slug}"><h2>${c.titulo}</h2><p>${c.texto}</p><span class="cartao-acao" aria-hidden="true">Calcular →</span></a></li>`).join('\n')}
</ul>

<section>
<h2>O que mudou em ${ano}</h2>
<ul>
<li><strong>Imposto de Renda:</strong> quem recebe até ${brl(5000)} por mês deixou de pagar IR na fonte. Um salário de ${brl(5000)} economiza ${brl(cinco.economiaReforma)} por mês. Entre ${brl(5000.01)} e ${brl(7350)}, o desconto diminui aos poucos.</li>
<li><strong>Salário mínimo:</strong> ${brl(TABELAS.salarioMinimo)}.</li>
<li><strong>INSS:</strong> novas faixas e teto de ${brl(TABELAS.inss.teto)}; o desconto máximo do empregado é de ${brl(calcularSalarioLiquido({ salarioBruto: TABELAS.inss.teto }).inss.valor)}.</li>
</ul>
</section>

<section>
<h2>Tabela do INSS ${ano}</h2>
${tabelaINSS()}
</section>

<section>
<h2>Tabela do Imposto de Renda ${ano}</h2>
${tabelaIRRF()}
</section>`;
  },
};
