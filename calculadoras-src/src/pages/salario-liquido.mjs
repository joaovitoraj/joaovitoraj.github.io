import { TABELAS } from '../engine/tabelas.js';
import { calcularSalarioLiquido } from '../engine/salario.js';
import { faixaIRRF } from '../engine/irrf.js';
import { brl, pct, tabelaINSS, tabelaIRRF } from '../site/html.mjs';
import { campoDinheiro, campoInteiro, avancado } from '../site/campos.mjs';

const ano = TABELAS.ano;

export default {
  slug: 'salario-liquido/',
  calculadora: 'salario-liquido',
  migalha: 'Salário líquido',
  titulo: `Calculadora de Salário Líquido ${ano} — INSS e IR com isenção até R$ 5 mil`,
  descricao: `Calcule o salário líquido de ${ano} com INSS, Imposto de Renda (já com a isenção até R$ 5 mil), dependentes e vale-transporte. Grátis e sem cadastro.`,
  h1: `Calculadora de salário líquido ${ano}`,
  lead: `Informe o salário bruto e veja na hora quanto vai receber, já com o novo desconto do Imposto de Renda que isenta quem ganha até R$ 5.000 por mês.`,

  formulario: () => `
${campoDinheiro({ nome: 'salario', rotulo: 'Salário bruto mensal', obrigatorio: true, placeholder: 'Ex.: 3.500,00', ajuda: 'Inclua horas extras, adicionais e comissões do mês, se houver.' })}
${campoInteiro({ nome: 'dependentes', rotulo: 'Dependentes no IR', max: 20, ajuda: 'Filhos, cônjuge e outros dependentes declarados.' })}
${avancado(
  'Outros descontos',
  `${campoDinheiro({ nome: 'vt', rotulo: 'Custo mensal do vale-transporte', ajuda: 'O desconto é limitado a 6% do salário.' })}
${campoDinheiro({ nome: 'pensao', rotulo: 'Pensão alimentícia (judicial)' })}
${campoDinheiro({ nome: 'previdencia', rotulo: 'Previdência privada (PGBL ou fundo de pensão)' })}
${campoDinheiro({ nome: 'outros', rotulo: 'Outros descontos (plano de saúde, VR etc.)' })}`,
)}`,

  conteudo: () => {
    const ex = calcularSalarioLiquido({ salarioBruto: 6000 });
    const faixa = faixaIRRF(ex.irrf.base);
    const red = TABELAS.irrf.reducao;
    const linhas = [1621, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 10000, 12000, 15000, 20000]
      .map((s) => {
        const r = calcularSalarioLiquido({ salarioBruto: s });
        return `<tr><td>${brl(s)}</td><td>${brl(r.inss.valor)}</td><td>${r.irrf.imposto ? brl(r.irrf.imposto) : 'Isento'}</td><td><strong>${brl(r.liquido)}</strong></td></tr>`;
      })
      .join('');
    const economia = [5000, 6000, 7000]
      .map((s) => {
        const r = calcularSalarioLiquido({ salarioBruto: s });
        return `<li>Salário de <strong>${brl(s)}</strong>: ${brl(r.economiaReforma)} a menos de IR por mês (${brl(r.economiaReforma * 13)} por ano, contando o 13º).</li>`;
      })
      .join('');
    return `
<section>
<h2>Como o salário líquido é calculado</h2>
<p>O salário líquido é o que sobra do salário bruto depois dos descontos obrigatórios — INSS e Imposto de Renda retido na fonte (IRRF) — e dos descontos que você autorizou, como vale-transporte e plano de saúde. A conta segue esta ordem:</p>
<ol>
<li><strong>INSS:</strong> aplica-se a tabela progressiva de ${ano}. Cada alíquota (7,5% a 14%) incide só sobre a parte do salário que está naquela faixa, até o teto de ${brl(TABELAS.inss.teto)}.</li>
<li><strong>Base do IR:</strong> do salário bruto saem o INSS, ${brl(TABELAS.irrf.deducaoDependente)} por dependente, a pensão alimentícia e a previdência privada. Se essas deduções somarem menos que ${brl(TABELAS.irrf.descontoSimplificado)}, usa-se o desconto simplificado — a calculadora escolhe o mais vantajoso.</li>
<li><strong>Imposto pela tabela:</strong> sobre a base, aplica-se a alíquota da faixa e subtrai-se a parcela a deduzir.</li>
<li><strong>Redução de ${ano}:</strong> quem recebe até R$ 5.000 tem o imposto zerado; entre R$ 5.000,01 e R$ 7.350, o imposto cai de forma gradual.</li>
<li><strong>Outros descontos:</strong> vale-transporte (até 6% do salário), pensão, plano de saúde e similares.</li>
</ol>
</section>

<section>
<h2>Exemplo: salário de ${brl(6000)}</h2>
<ul>
<li>INSS: ${brl(ex.inss.valor)} (alíquota efetiva de ${pct(ex.inss.aliquotaEfetiva)})</li>
<li>Base do IR: ${brl(6000)} − ${brl(ex.inss.valor)} = ${brl(ex.irrf.base)}</li>
<li>IR pela tabela: ${brl(ex.irrf.base)} × ${pct(faixa.aliquota)} − ${brl(faixa.deducao)} = ${brl(ex.irrf.impostoTabela)}</li>
<li>Redução de ${ano}: ${brl(red.constante)} − ${String(red.coeficiente).replace('.', ',')} × ${brl(6000)} = ${brl(ex.irrf.reducao)}</li>
<li>IR a pagar: ${brl(ex.irrf.impostoTabela)} − ${brl(ex.irrf.reducao)} = <strong>${brl(ex.irrf.imposto)}</strong></li>
<li>Salário líquido: <strong>${brl(ex.liquido)}</strong></li>
</ul>
</section>

<section>
<h2>Tabela de salário bruto x líquido em ${ano}</h2>
<p>Valores para quem não tem dependentes nem outros descontos.</p>
<div class="tabela-rolagem"><table>
<caption>Salário líquido por faixa de salário bruto (${ano})</caption>
<thead><tr><th scope="col">Bruto</th><th scope="col">INSS</th><th scope="col">IR</th><th scope="col">Líquido</th></tr></thead>
<tbody>${linhas}</tbody>
</table></div>
</section>

<section>
<h2>O que mudou no Imposto de Renda em ${ano}</h2>
<p>A Lei 15.270/2025 criou uma redução do imposto para quem recebe até ${brl(7350)} por mês. A tabela progressiva continua a mesma, mas, depois de calcular o imposto, aplica-se um desconto que zera o IR de quem ganha até ${brl(5000)} e diminui o de quem ganha até ${brl(7350)}. Na prática:</p>
<ul>${economia}</ul>
<p>A redução vale também para o 13º salário e para as férias, que são calculados separadamente.</p>
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

  faq: [
    {
      p: `Quem ganha R$ 5.000 paga Imposto de Renda em ${ano}?`,
      r: `<p>Não. A partir de janeiro de ${ano}, quem tem rendimento tributável de até R$ 5.000 por mês tem o IR retido na fonte zerado pela redução da Lei 15.270/2025. O INSS continua sendo descontado normalmente.</p>`,
    },
    {
      p: 'O que é o desconto simplificado mensal?',
      r: `<p>É um desconto fixo de ${brl(TABELAS.irrf.descontoSimplificado)} que pode substituir as deduções legais (INSS, dependentes, pensão e previdência) no cálculo do IR. A empresa deve usar o que for mais vantajoso para você — esta calculadora faz essa escolha automaticamente.</p>`,
    },
    {
      p: 'O vale-transporte é descontado do salário?',
      r: '<p>Sim, se você usa o benefício. A empresa pode descontar até 6% do salário-base; se o custo das passagens for menor que isso, o desconto é limitado ao custo.</p>',
    },
    {
      p: 'O FGTS é descontado do salário?',
      r: `<p>Não. O FGTS é pago pela empresa: ela deposita 8% do salário bruto na sua conta vinculada da Caixa, sem descontar nada de você.</p>`,
    },
    {
      p: 'Horas extras e adicionais entram no cálculo?',
      r: '<p>Sim. Some ao salário-base as horas extras, adicional noturno, insalubridade, periculosidade e comissões do mês. Todos esses valores sofrem INSS e IR.</p>',
    },
    {
      p: 'Quanto cada dependente reduz do imposto?',
      r: `<p>Cada dependente diminui ${brl(TABELAS.irrf.deducaoDependente)} da base de cálculo. Para quem está na alíquota de 27,5%, isso dá cerca de ${brl(TABELAS.irrf.deducaoDependente * 0.275)} a menos de imposto por dependente, por mês.</p>`,
    },
    {
      p: 'Por que o valor do meu holerite é um pouco diferente?',
      r: '<p>Diferenças de centavos vêm de arredondamentos. Diferenças maiores costumam vir de itens que não entram aqui: faltas, adiantamentos, coparticipação do plano de saúde, contribuição sindical ou benefícios pagos em dinheiro.</p>',
    },
  ],
};
