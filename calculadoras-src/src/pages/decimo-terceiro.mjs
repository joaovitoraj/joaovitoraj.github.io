import { TABELAS } from '../engine/tabelas.js';
import { calcularDecimoTerceiro } from '../engine/decimo-terceiro.js';
import { brl } from '../site/html.mjs';
import { campoDinheiro, campoInteiro, campoSelect, avancado } from '../site/campos.mjs';

const ano = TABELAS.ano;
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

// Prazo legal e, se cair em fim de semana, o último dia útil anterior.
function prazo(mes0, dia) {
  const d = new Date(Date.UTC(ano, mes0, dia));
  const semana = d.getUTCDay();
  const recuo = semana === 0 ? 2 : semana === 6 ? 1 : 0;
  const util = new Date(Date.UTC(ano, mes0, dia - recuo));
  const fmt = (x) => `${x.getUTCDate()}/${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
  return recuo
    ? `${fmt(d)} cai em um ${DIAS[semana]}, então o pagamento deve ser antecipado para ${DIAS[util.getUTCDay()]}, ${fmt(util)}`
    : `${fmt(d)} cai em uma ${DIAS[semana]}`;
}

export default {
  slug: 'decimo-terceiro/',
  calculadora: 'decimo-terceiro',
  migalha: '13º salário',
  titulo: `Calculadora de 13º Salário ${ano} — 1ª e 2ª parcela com descontos`,
  descricao: `Calcule o 13º salário de ${ano}: valor da 1ª parcela (até 30/11), da 2ª parcela (até 20/12), INSS e IR com a isenção até R$ 5 mil, e o proporcional para quem trabalhou menos de 12 meses.`,
  h1: `Calculadora de 13º salário ${ano}`,
  lead: 'Descubra quanto vai receber em cada parcela do 13º salário, já com os descontos de INSS e Imposto de Renda — inclusive se você trabalhou só parte do ano.',

  formulario: () => `
${campoDinheiro({ nome: 'salario', rotulo: 'Salário bruto mensal', obrigatorio: true, placeholder: 'Ex.: 3.200,00' })}
${campoSelect({
  nome: 'meses',
  rotulo: `Meses trabalhados em ${ano}`,
  valor: 12,
  opcoes: Array.from({ length: 12 }, (_, i) => ({ valor: 12 - i, rotulo: `${12 - i} ${12 - i === 1 ? 'mês' : 'meses'}` })),
  ajuda: 'Conta como mês trabalhado aquele em que você trabalhou 15 dias ou mais.',
})}
${avancado(
  'Médias e dependentes',
  `${campoDinheiro({ nome: 'medias', rotulo: 'Média de horas extras e adicionais', ajuda: 'Média mensal do ano.' })}
${campoInteiro({ nome: 'dependentes', rotulo: 'Dependentes no IR', max: 20 })}`,
)}`,

  conteudo: () => {
    const linhas = [1621, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 15000]
      .map((s) => {
        const r = calcularDecimoTerceiro({ salario: s });
        return `<tr><td>${brl(s)}</td><td>${brl(r.primeiraParcela)}</td><td>${brl(r.inss.valor + r.irrf.imposto)}</td><td>${brl(r.segundaParcela)}</td><td><strong>${brl(r.liquido)}</strong></td></tr>`;
      })
      .join('');
    return `
<section>
<h2>Datas de pagamento do 13º em ${ano}</h2>
<ul>
<li><strong>1ª parcela:</strong> entre fevereiro e 30 de novembro. Em ${ano}, ${prazo(10, 30)}.</li>
<li><strong>2ª parcela:</strong> até 20 de dezembro. Em ${ano}, ${prazo(11, 20)}.</li>
</ul>
<p>A primeira parcela pode ser antecipada para junto das férias, se você pedir em janeiro.</p>
</section>

<section>
<h2>Como o 13º é calculado</h2>
<ol>
<li><strong>Valor bruto:</strong> (salário + médias) ÷ 12 × meses trabalhados no ano.</li>
<li><strong>1ª parcela:</strong> metade do valor bruto, sem nenhum desconto.</li>
<li><strong>Descontos:</strong> INSS e IR são calculados sobre o 13º inteiro, separadamente do salário de dezembro, e descontados de uma vez na 2ª parcela. A isenção de ${ano} para quem recebe até ${brl(5000)} vale também para o 13º.</li>
<li><strong>2ª parcela:</strong> valor bruto − 1ª parcela − INSS − IR. Por isso ela é sempre menor que a primeira.</li>
</ol>
</section>

<section>
<h2>Tabela do 13º salário em ${ano}</h2>
<p>Para 12 meses trabalhados, sem dependentes.</p>
<div class="tabela-rolagem"><table>
<caption>Parcelas do 13º salário por faixa de salário (${ano})</caption>
<thead><tr><th scope="col">Salário</th><th scope="col">1ª parcela</th><th scope="col">INSS + IR</th><th scope="col">2ª parcela</th><th scope="col">Total líquido</th></tr></thead>
<tbody>${linhas}</tbody>
</table></div>
</section>`;
  },

  faq: [
    {
      p: 'Quem tem direito ao 13º salário?',
      r: '<p>Todo trabalhador com carteira assinada, inclusive domésticos, temporários e safristas, além de aposentados e pensionistas do INSS. Estagiários e PJ não têm direito por lei.</p>',
    },
    {
      p: 'Quem foi demitido recebe o 13º?',
      r: '<p>Sim, o proporcional aos meses trabalhados no ano, pago na rescisão. A única exceção é a demissão por justa causa.</p>',
    },
    {
      p: 'Por que a 2ª parcela é menor que a 1ª?',
      r: '<p>Porque a 1ª parcela é paga sem descontos. O INSS e o IR do 13º inteiro saem todos da 2ª parcela.</p>',
    },
    {
      p: `O 13º tem isenção de IR até R$ 5 mil em ${ano}?`,
      r: '<p>Sim. A Receita Federal aplica ao 13º a mesma redução do salário mensal: se o 13º for de até R$ 5.000, não há IR; entre R$ 5.000,01 e R$ 7.350, o imposto é reduzido.</p>',
    },
    {
      p: 'Afastamento por doença conta para o 13º?',
      r: '<p>Os primeiros 15 dias de afastamento são pagos pela empresa e contam normalmente. A partir daí, o período coberto pelo INSS gera o abono anual, pago pelo próprio INSS, proporcional aos meses de benefício.</p>',
    },
    {
      p: 'Faltas diminuem o 13º?',
      r: '<p>Faltas injustificadas podem tirar o mês da conta se, por causa delas, você tiver trabalhado menos de 15 dias naquele mês.</p>',
    },
  ],
};
