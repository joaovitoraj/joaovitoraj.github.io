import { TABELAS } from '../engine/tabelas.js';
import { esc, dataExtensa } from '../site/html.mjs';

export default {
  slug: 'sobre/',
  migalha: 'Sobre',
  titulo: 'Sobre o site e metodologia dos cálculos',
  descricao: `Quem faz as calculadoras, quais tabelas e leis são usadas em ${TABELAS.ano} e como cada valor é calculado.`,
  h1: 'Sobre e metodologia',

  conteudo: (ctx) => {
    const { config } = ctx;
    const contato = config.contatoEmail
      ? `<p>Encontrou um erro ou tem uma sugestão? Escreva para <a href="mailto:${esc(config.contatoEmail)}">${esc(config.contatoEmail)}</a>.</p>`
      : `<p>Encontrou um erro ou tem uma sugestão? Fale com o autor pela <a href="${esc(config.autor.url)}">página pessoal</a>.</p>`;
    return `
<section>
<h2>Quem faz</h2>
<p>O ${esc(config.nome)} é mantido por <a href="${esc(config.autor.url)}">${esc(config.autor.nome)}</a>, ${esc(config.autor.descricao.toLowerCase())}. A proposta é simples: calculadoras trabalhistas rápidas, gratuitas, sem cadastro e que mostram a conta passo a passo.</p>
${contato}
</section>

<section>
<h2>Como os cálculos são feitos</h2>
<ul>
<li>Todas as contas rodam no seu navegador. Os valores digitados não são enviados nem armazenados em servidores.</li>
<li>Os valores são arredondados em centavos (meio centavo para cima), como nas folhas de pagamento.</li>
<li>O motor de cálculo tem testes automáticos com valores de referência publicados e casos calculados à mão, executados a cada alteração do site.</li>
<li>As tabelas foram revisadas em ${dataExtensa(config.atualizadoEm)} e valem de ${dataExtensa(TABELAS.vigencia.inicio)} a ${dataExtensa(TABELAS.vigencia.fim)}.</li>
</ul>
</section>

<section>
<h2>Legislação e tabelas usadas</h2>
<ul>
${TABELAS.fontes.map((f) => `<li>${esc(f.nome)}</li>`).join('\n')}
</ul>
</section>

<section>
<h2>Limitações</h2>
<p>As calculadoras fazem estimativas para os casos mais comuns. Convenções coletivas, verbas variáveis, adiantamentos, faltas e decisões judiciais podem mudar o resultado. Para decisões importantes — como aceitar uma proposta PJ ou conferir uma rescisão — consulte um contador ou advogado trabalhista.</p>
</section>`;
  },
};
