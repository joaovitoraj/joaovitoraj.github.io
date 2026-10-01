import { TABELAS } from '../engine/tabelas.js';
import { compararCltPj, calcularPJ } from '../engine/pj.js';
import { brl, pct, esc } from '../site/html.mjs';
import { campoDinheiro, campoInteiro, campoSelect, campoPercentual, campoCheckbox, avancado, grupo } from '../site/campos.mjs';
import { blocoAfiliadoContabilidade } from '../site/layout.mjs';

const ano = TABELAS.ano;
const CONTADOR_PADRAO = 250;

function tabelaAnexo(titulo, faixas) {
  let anterior = 0;
  const linhas = faixas
    .map((f) => {
      const faixa = anterior === 0 ? `Até ${brl(f.ate)}` : `De ${brl(anterior + 0.01)} até ${brl(f.ate)}`;
      anterior = f.ate;
      return `<tr><td>${faixa}</td><td>${pct(f.aliquota)}</td><td>${f.deducao ? brl(f.deducao) : '—'}</td></tr>`;
    })
    .join('');
  return `<div class="tabela-rolagem"><table>
<caption>${esc(titulo)}</caption>
<thead><tr><th scope="col">Receita bruta em 12 meses</th><th scope="col">Alíquota nominal</th><th scope="col">Parcela a deduzir</th></tr></thead>
<tbody>${linhas}</tbody>
</table></div>`;
}

export default {
  slug: 'clt-x-pj/',
  calculadora: 'clt-x-pj',
  migalha: 'CLT x PJ',
  titulo: `Calculadora CLT x PJ ${ano} — quanto pedir como PJ para valer a pena`,
  descricao: `Compare uma vaga CLT com uma proposta PJ em ${ano}: salário líquido, férias, 13º, FGTS, benefícios e impostos do Simples (Fator R) ou Lucro Presumido. Veja quanto cobrar para empatar.`,
  h1: `Calculadora CLT x PJ ${ano}`,
  lead: 'Coloque lado a lado o salário CLT e o valor da proposta PJ. A calculadora considera férias, 13º, FGTS, benefícios e os impostos da empresa — e mostra quanto você precisa cobrar como PJ para não sair perdendo.',

  formulario: () => `
${grupo(
  'Vaga CLT',
  `${campoDinheiro({ nome: 'salario', rotulo: 'Salário bruto mensal', obrigatorio: true, placeholder: 'Ex.: 8.000,00' })}
${campoDinheiro({ nome: 'beneficios', rotulo: 'Benefícios por mês', ajuda: 'VR, VA, plano de saúde pago pela empresa, auxílios. Use o valor que você gastaria do próprio bolso.' })}
${campoDinheiro({ nome: 'plr', rotulo: 'PLR ou bônus por ano (líquido)' })}`,
  'grupo-clt',
)}
${grupo(
  'Proposta PJ',
  `${campoDinheiro({ nome: 'pj', rotulo: 'Valor mensal da nota fiscal', obrigatorio: true, placeholder: 'Ex.: 12.000,00' })}
${campoSelect({
  nome: 'meses',
  rotulo: 'Meses faturados por ano',
  valor: 12,
  opcoes: [
    { valor: 12, rotulo: '12 meses' },
    { valor: 11, rotulo: '11 meses (1 mês de folga sem receber)' },
    { valor: 10, rotulo: '10 meses (2 meses de folga sem receber)' },
  ],
  ajuda: 'PJ não tem férias remuneradas por lei. Se pretende tirar folga sem faturar, reduza os meses.',
})}
${campoDinheiro({ nome: 'contador', rotulo: 'Contabilidade por mês', valor: '250,00' })}
${campoDinheiro({ nome: 'custos', rotulo: 'Outros custos mensais do PJ', ajuda: 'Plano de saúde próprio, equipamento, cursos — o que a empresa CLT pagaria por você.' })}`,
  'grupo-pj',
)}
${avancado(
  'Ajustes avançados',
  `${campoInteiro({ nome: 'dependentes', rotulo: 'Dependentes no IR', max: 20 })}
${campoSelect({
  nome: 'regime',
  rotulo: 'Regime tributário do PJ',
  valor: 'auto',
  opcoes: [
    { valor: 'auto', rotulo: 'Escolher o mais vantajoso' },
    { valor: 'simplesIII', rotulo: 'Simples — Anexo III (Fator R)' },
    { valor: 'simplesV', rotulo: 'Simples — Anexo V' },
    { valor: 'presumido', rotulo: 'Lucro Presumido' },
  ],
})}
${campoPercentual({ nome: 'iss', rotulo: 'ISS no Lucro Presumido', valor: '2', ajuda: 'Varia de 2% a 5% conforme a cidade e a atividade.' })}
${campoCheckbox({ nome: 'fgts', rotulo: 'Contar o FGTS da vaga CLT como dinheiro', marcado: true })}
${campoCheckbox({ nome: 'multa', rotulo: 'Contar a multa de 40% do FGTS (se espera ser demitido)' })}`,
)}`,

  depoisDaCalculadora: (ctx) => blocoAfiliadoContabilidade(ctx),

  conteudo: () => {
    const linhas = [3000, 5000, 7000, 10000, 15000, 20000]
      .map((s) => {
        const c = compararCltPj({ clt: { salario: s }, pj: { faturamentoMensal: s, contador: CONTADOR_PADRAO } });
        return `<tr><td>${brl(s)}</td><td>${brl(c.clt.equivalenteMensal)}</td><td><strong>${brl(c.pjEquilibrio)}</strong></td><td>${(c.pjEquilibrio / s).toFixed(2).replace('.', ',')}×</td></tr>`;
      })
      .join('');
    const ex = calcularPJ({ faturamentoMensal: 15000, contador: CONTADOR_PADRAO });
    const iii = ex.cenarios.find((c) => c.regime === 'simplesIII');
    const v = ex.cenarios.find((c) => c.regime === 'simplesV');
    return `
<section>
<h2>Quanto pedir como PJ para empatar com o CLT</h2>
<p>A tabela mostra o valor mínimo da nota fiscal mensal para que o PJ renda o mesmo que a vaga CLT, sem benefícios, com contabilidade de ${brl(CONTADOR_PADRAO)} por mês e 12 meses faturados. Com benefícios, PLR ou meses sem faturar, o valor sobe — use a calculadora acima para o seu caso.</p>
<div class="tabela-rolagem"><table>
<caption>Valor PJ de equilíbrio por salário CLT (${ano})</caption>
<thead><tr><th scope="col">Salário CLT</th><th scope="col">Pacote CLT por mês*</th><th scope="col">PJ mínimo</th><th scope="col">Multiplicador</th></tr></thead>
<tbody>${linhas}</tbody>
</table></div>
<p class="nota">* Pacote CLT por mês = (salários líquidos + férias com 1/3 + 13º + FGTS) ÷ 12.</p>
</section>

<section>
<h2>Como a comparação é feita</h2>
<p><strong>Lado CLT:</strong> somamos o que você recebe em um ano — 11 salários líquidos, o mês de férias com o terço constitucional, o 13º salário (todos já sem INSS e IR), o FGTS depositado (8% sobre 13,33 salários) e os benefícios. A multa de 40% do FGTS só entra se você marcar a opção, porque só é paga na demissão sem justa causa.</p>
<p><strong>Lado PJ:</strong> do valor da nota saem os impostos da empresa, o INSS e o IR do pró-labore, a contabilidade e os custos que a empresa CLT pagaria por você. O que sobra é distribuído como lucro, que é isento de IR até ${brl(TABELAS.altaRenda.dividendosMensaisSemRetencao)} por mês.</p>
<p>A calculadora testa três regimes e escolhe o que deixa mais dinheiro no seu bolso: Simples Nacional no Anexo III (com Fator R), Simples no Anexo V e Lucro Presumido.</p>
</section>

<section>
<h2>Fator R: como pagar 6% em vez de 15,5%</h2>
<p>Atividades como desenvolvimento de software, consultoria, engenharia e design ficam no Anexo V do Simples (alíquota inicial de 15,5%). Mas, se a folha de pagamento — que inclui o pró-labore do sócio — for de pelo menos 28% do faturamento, a empresa passa para o Anexo III, que começa em 6%. Esse é o Fator R.</p>
<p>Exemplo com nota de ${brl(15000)} por mês:</p>
<ul>
<li><strong>Anexo III:</strong> pró-labore de ${brl(iii.proLabore)} (28%), impostos de ${brl(iii.impostos)} → sobra ${brl(iii.liquido)} por mês.</li>
<li><strong>Anexo V:</strong> pró-labore de um salário mínimo, impostos de ${brl(v.impostos)} → sobra ${brl(v.liquido)} por mês.</li>
</ul>
<p>O pró-labore maior tem outra vantagem: você contribui mais para o INSS e garante uma aposentadoria e benefícios (auxílio-doença, salário-maternidade) melhores.</p>
${tabelaAnexo('Simples Nacional — Anexo III', TABELAS.simples.anexoIII)}
${tabelaAnexo('Simples Nacional — Anexo V', TABELAS.simples.anexoV)}
<p class="nota">Alíquota efetiva = (receita de 12 meses × alíquota nominal − parcela a deduzir) ÷ receita de 12 meses.</p>
</section>

<section>
<h2>O que a conta não mostra</h2>
<ul>
<li><strong>Estabilidade e seguro-desemprego:</strong> o CLT demitido sem justa causa recebe aviso prévio, multa de 40% do FGTS e seguro-desemprego. O PJ pode ter o contrato encerrado sem nada disso.</li>
<li><strong>Férias:</strong> o PJ só descansa remunerado se embutir isso no preço ou negociar em contrato.</li>
<li><strong>Aposentadoria:</strong> com pró-labore baixo, a contribuição ao INSS é menor, e o benefício futuro também.</li>
<li><strong>Vínculo disfarçado:</strong> se há subordinação, horário fixo e exclusividade, a contratação como PJ pode ser considerada vínculo de emprego pela Justiça do Trabalho.</li>
<li><strong>Negociação:</strong> reajustes, PLR e promoções costumam ser diferentes nos dois modelos. Vale colocar no contrato PJ um reajuste anual e um período de recesso.</li>
</ul>
</section>`;
  },

  faq: [
    {
      p: 'Quanto pedir a mais como PJ?',
      r: '<p>Sem benefícios, o PJ empata com o CLT recebendo de 1,0 a 1,35 vez o salário bruto — a diferença é maior nos salários mais baixos, em que o CLT já é isento de IR. Quando a vaga CLT tem vale-refeição, plano de saúde e PLR, e você quer tirar um mês de folga por ano, o equilíbrio sobe para algo entre 1,4 e 1,8 vez. Use a calculadora com os seus números.</p>',
    },
    {
      p: 'O que é o Fator R?',
      r: '<p>É a relação entre a folha de pagamento dos últimos 12 meses (incluindo pró-labore) e o faturamento do mesmo período. Se for 28% ou mais, atividades intelectuais pagam o Simples pelo Anexo III, bem mais barato que o Anexo V.</p>',
    },
    {
      p: 'Posso ser MEI trabalhando como PJ?',
      r: '<p>Na maioria das profissões intelectuais, não: programação, consultoria, engenharia e similares não estão na lista de atividades do MEI. Além disso, o MEI tem limite de faturamento de R$ 81 mil por ano. Por isso a calculadora considera Simples Nacional e Lucro Presumido.</p>',
    },
    {
      p: 'PJ tem direito a férias e 13º?',
      r: '<p>Não por lei. O contrato PJ é entre empresas, então férias remuneradas, 13º e reajustes só existem se forem negociados. Por isso vale cobrar mais ou incluir essas condições no contrato.</p>',
    },
    {
      p: 'Como PJ preciso pagar INSS?',
      r: `<p>Sim. O sócio paga 11% sobre o pró-labore (limitado ao teto de ${brl(TABELAS.inss.teto)}), além do IR na fonte se o pró-labore passar da faixa de isenção. A calculadora já desconta esses valores.</p>`,
    },
    {
      p: `Os lucros distribuídos pagam imposto em ${ano}?`,
      r: `<p>Até ${brl(TABELAS.altaRenda.dividendosMensaisSemRetencao)} por mês da mesma empresa, não há retenção. Acima disso, a Lei 15.270/2025 prevê retenção de 10% na fonte, e quem tem renda anual acima de ${brl(TABELAS.altaRenda.irpfmRendaAnual)} pode pagar um imposto mínimo na declaração.</p>`,
    },
    {
      p: 'Quanto custa um contador para PJ?',
      r: '<p>Contabilidades online cobram, em geral, de R$ 100 a R$ 400 por mês para empresas de serviço no Simples, sem funcionários. No Lucro Presumido o valor costuma ser maior.</p>',
    },
  ],
};
