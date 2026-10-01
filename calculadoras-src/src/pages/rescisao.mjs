import { TABELAS } from '../engine/tabelas.js';
import { calcularRescisao, TIPOS_RESCISAO } from '../engine/rescisao.js';
import { brl, esc } from '../site/html.mjs';
import { campoDinheiro, campoInteiro, campoSelect, campoData, campoCheckbox, avancado } from '../site/campos.mjs';

const ano = TABELAS.ano;

const MATRIZ = [
  ['Saldo de salário', [1, 1, 1, 1, 1]],
  ['Aviso prévio indenizado', [1, 0, 'metade', 0, 0]],
  ['13º proporcional', [1, 1, 1, 0, 1]],
  ['Férias vencidas + 1/3', [1, 1, 1, 1, 1]],
  ['Férias proporcionais + 1/3', [1, 1, 1, 0, 1]],
  ['Multa do FGTS', ['40%', 0, '20%', 0, 0]],
  ['Saque do FGTS', [1, 0, '80%', 0, 1]],
  ['Seguro-desemprego', [1, 0, 0, 0, 0]],
];
const ORDEM = ['semJustaCausa', 'pedidoDemissao', 'acordo', 'justaCausa', 'fimExperiencia'];
const NOMES_CURTOS = ['Sem justa causa', 'Pedido de demissão', 'Acordo', 'Justa causa', 'Fim da experiência'];

function celula(v) {
  if (v === 1) return '<td><span class="sim">Sim</span></td>';
  if (v === 0) return '<td><span class="nao">Não</span></td>';
  return `<td><span class="sim">${esc(v)}</span></td>`;
}

export default {
  slug: 'rescisao/',
  calculadora: 'rescisao',
  migalha: 'Rescisão',
  titulo: `Calculadora de Rescisão ${ano} — quanto vou receber ao sair da empresa`,
  descricao: `Calcule sua rescisão em ${ano}: saldo de salário, aviso prévio proporcional, 13º, férias + 1/3 e FGTS com multa. Demissão, pedido de demissão, acordo e justa causa.`,
  h1: `Calculadora de rescisão trabalhista ${ano}`,
  lead: 'Saiba quanto você tem a receber ao sair do emprego: verbas rescisórias, descontos, multa e saque do FGTS — para demissão sem justa causa, pedido de demissão, acordo, justa causa ou fim do contrato de experiência.',

  formulario: () => `
${campoDinheiro({ nome: 'salario', rotulo: 'Último salário bruto', obrigatorio: true, placeholder: 'Ex.: 3.000,00' })}
${campoData({ nome: 'admissao', rotulo: 'Data de admissão' })}
${campoData({ nome: 'saida', rotulo: 'Último dia de trabalho', ajuda: 'Se vai cumprir aviso, use o último dia do aviso.' })}
${campoSelect({
  nome: 'tipo',
  rotulo: 'Motivo da saída',
  valor: 'semJustaCausa',
  opcoes: ORDEM.map((t) => ({ valor: t, rotulo: TIPOS_RESCISAO[t] })),
})}
${campoSelect({
  nome: 'aviso',
  rotulo: 'Aviso prévio',
  valor: 'indenizado',
  opcoes: [
    { valor: 'indenizado', rotulo: 'Indenizado (não vou trabalhar)' },
    { valor: 'trabalhado', rotulo: 'Trabalhado' },
    { valor: 'dispensado', rotulo: 'Dispensado pela empresa' },
    { valor: 'naoCumprido', rotulo: 'Não vou cumprir (será descontado)' },
  ],
})}
${campoSelect({
  nome: 'vencidas',
  rotulo: 'Férias vencidas não tiradas',
  valor: 0,
  opcoes: [
    { valor: 0, rotulo: 'Nenhuma' },
    { valor: 1, rotulo: '1 período' },
    { valor: 2, rotulo: '2 períodos' },
  ],
  ajuda: 'Períodos de 12 meses completos em que você ainda não tirou férias.',
})}
${avancado(
  'FGTS e outros ajustes',
  `${campoDinheiro({ nome: 'fgts', rotulo: 'Saldo atual do FGTS deste emprego', ajuda: 'Veja no app FGTS. Se deixar em branco, estimamos pelo tempo de casa.' })}
${campoCheckbox({ nome: 'aniversario', rotulo: 'Optei pelo saque-aniversário do FGTS' })}
${campoDinheiro({ nome: 'medias', rotulo: 'Média de horas extras e adicionais', ajuda: 'Média mensal dos últimos 12 meses.' })}
${campoInteiro({ nome: 'dependentes', rotulo: 'Dependentes no IR', max: 20 })}`,
)}`,

  conteudo: () => {
    const ex = calcularRescisao({ salario: 3000, admissao: '2023-03-10', saida: '2026-09-25', tipo: 'semJustaCausa' });
    const itensEx = ex.itens
      .map((i) => `<li>${esc(i.descricao)}: ${i.natureza === 'desconto' ? '−' : ''}${brl(i.valor)}</li>`)
      .join('');
    return `
<section>
<h2>O que você recebe em cada tipo de rescisão</h2>
<div class="tabela-rolagem"><table class="matriz">
<caption>Verbas rescisórias por motivo de saída</caption>
<thead><tr><th scope="col">Verba</th>${NOMES_CURTOS.map((n) => `<th scope="col">${n}</th>`).join('')}</tr></thead>
<tbody>${MATRIZ.map(([verba, valores]) => `<tr><th scope="row">${verba}</th>${valores.map(celula).join('')}</tr>`).join('')}</tbody>
</table></div>
</section>

<section>
<h2>Como cada verba é calculada</h2>
<dl class="definicoes">
<dt>Saldo de salário</dt>
<dd>Os dias trabalhados no mês da saída: salário ÷ 30 × dias. O mês inteiro conta sempre como 30 dias.</dd>
<dt>Aviso prévio proporcional</dt>
<dd>30 dias, mais 3 dias por ano completo de empresa, até o máximo de 90 dias (Lei 12.506/2011). Quando é indenizado, os dias também contam como tempo de serviço para o 13º e as férias — é a chamada projeção do aviso.</dd>
<dt>13º salário proporcional</dt>
<dd>Salário ÷ 12 × meses trabalhados no ano. Conta como mês inteiro aquele em que você trabalhou 15 dias ou mais.</dd>
<dt>Férias</dt>
<dd>Férias vencidas valem um salário por período, e as proporcionais, salário ÷ 12 × meses do período aquisitivo atual. Sobre as duas se soma o terço constitucional (1/3).</dd>
<dt>FGTS</dt>
<dd>Na demissão sem justa causa, a empresa deposita 40% do saldo do FGTS como multa e você saca tudo. No acordo, a multa é de 20% e o saque, de 80% do saldo.</dd>
</dl>
</section>

<section>
<h2>Exemplo: ${brl(3000)} de salário, demitido sem justa causa</h2>
<p>Admissão em 10/03/2023, último dia em 25/09/2026, aviso indenizado. Com ${ex.anosCompletos} anos completos, o aviso é de ${ex.diasAvisoProporcional} dias, o que projeta o fim do contrato para ${ex.fimProjetado.split('-').reverse().join('/')}.</p>
<ul>${itensEx}</ul>
<p>Valor líquido da rescisão: <strong>${brl(ex.liquido)}</strong>. Além disso, o FGTS estimado de ${brl(ex.fgts.saldo + ex.fgts.depositoRescisorio)} mais a multa de ${brl(ex.fgts.multa)} ficam disponíveis para saque: ${brl(ex.fgts.saque)}.</p>
</section>

<section>
<h2>Descontos na rescisão</h2>
<p>O saldo de salário e o 13º sofrem desconto de INSS e de Imposto de Renda, calculados separadamente — e com a isenção de ${ano} para valores até ${brl(5000)}. Já o aviso prévio indenizado e as férias indenizadas (vencidas e proporcionais, com o terço) são verbas indenizatórias: não têm INSS nem IR.</p>
</section>

<section>
<h2>Prazo para pagamento</h2>
<p>A empresa tem até 10 dias corridos depois do fim do contrato para pagar as verbas e entregar os documentos da rescisão (CLT, art. 477). Se atrasar, deve pagar uma multa no valor de um salário.</p>
</section>`;
  },

  faq: [
    {
      p: 'Quem pede demissão tem direito a quê?',
      r: '<p>Saldo de salário, 13º proporcional, férias vencidas e proporcionais com 1/3. Não recebe multa do FGTS, não saca o fundo e não tem seguro-desemprego. Se não cumprir o aviso de 30 dias, a empresa pode descontar um salário.</p>',
    },
    {
      p: 'Como funciona o aviso prévio proporcional?',
      r: '<p>São 30 dias para quem tem menos de um ano de empresa e mais 3 dias por ano completo, até 90 dias. O acréscimo vale para quando a empresa demite. Quem pede demissão cumpre sempre 30 dias.</p>',
    },
    {
      p: 'O que é a demissão por acordo?',
      r: '<p>Criada pela reforma trabalhista (CLT, art. 484-A), permite encerrar o contrato em comum acordo. Você recebe metade do aviso prévio indenizado, multa de 20% do FGTS, saca 80% do saldo e não tem direito ao seguro-desemprego. As demais verbas são integrais.</p>',
    },
    {
      p: 'Optei pelo saque-aniversário. Saco o FGTS na demissão?',
      r: '<p>Não. Quem está no saque-aniversário recebe só a multa rescisória (40% ou 20%); o saldo continua bloqueado. É possível voltar ao saque-rescisão, mas a mudança só vale 25 meses depois do pedido.</p>',
    },
    {
      p: 'Tenho direito ao seguro-desemprego?',
      r: '<p>Na demissão sem justa causa, sim, se cumprir o tempo mínimo de trabalho: 12 meses nos últimos 18 no primeiro pedido, 9 meses nos últimos 12 no segundo e 6 meses a partir do terceiro.</p>',
    },
    {
      p: 'E se minhas férias vencidas passaram do prazo?',
      r: '<p>Se a empresa não concedeu as férias nos 12 meses seguintes ao período aquisitivo, elas devem ser pagas em dobro (CLT, art. 137). A calculadora mostra o valor simples — nesse caso, some mais uma vez o valor das férias vencidas.</p>',
    },
    {
      p: 'Já recebi a primeira parcela do 13º. Ela entra na conta?',
      r: '<p>Se a saída acontece depois do pagamento da primeira parcela (até 30 de novembro), o valor adiantado é descontado do 13º proporcional da rescisão.</p>',
    },
  ],
};
