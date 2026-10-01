import { esc, dataExtensa } from '../site/html.mjs';

export default {
  slug: 'privacidade/',
  migalha: 'Privacidade',
  titulo: 'Política de privacidade',
  descricao: 'Como o site trata seus dados: cálculos feitos no navegador, cookies de publicidade e de estatísticas e seus direitos pela LGPD.',
  h1: 'Política de privacidade',

  conteudo: (ctx) => {
    const { config } = ctx;
    const temAnuncios = Boolean(config.monetizacao.adsenseClient);
    const temGA = Boolean(config.analytics.ga4);
    const temGoat = Boolean(config.analytics.goatcounter);
    const contato = config.contatoEmail
      ? `pelo e-mail <a href="mailto:${esc(config.contatoEmail)}">${esc(config.contatoEmail)}</a>`
      : `pela <a href="${esc(config.autor.url)}">página do responsável</a>`;
    return `
<p>Última atualização: ${dataExtensa(config.atualizadoEm)}.</p>

<section>
<h2>Dados que você digita nas calculadoras</h2>
<p>Salários, datas e demais valores são processados apenas no seu navegador. Eles não são enviados, gravados nem compartilhados por este site. Se você usar o botão de compartilhar, os valores vão no próprio link — só quem receber o link vai vê-los.</p>
</section>

<section>
<h2>Cookies e serviços de terceiros</h2>
<ul>
${
  temAnuncios
    ? '<li><strong>Publicidade:</strong> exibimos anúncios do Google AdSense. O Google e seus parceiros podem usar cookies para mostrar anúncios com base em visitas anteriores a este e a outros sites. Você pode desativar a publicidade personalizada em <a href="https://adssettings.google.com" rel="noopener">adssettings.google.com</a>. Saiba mais em <a href="https://policies.google.com/technologies/ads" rel="noopener">policies.google.com/technologies/ads</a>.</li>'
    : '<li><strong>Publicidade:</strong> no momento, o site não exibe anúncios. Se passar a exibir, esta política será atualizada.</li>'
}
${temGA ? '<li><strong>Estatísticas:</strong> usamos o Google Analytics para contar visitas e entender quais páginas são mais úteis. Ele usa cookies e coleta dados como páginas visitadas, tipo de dispositivo e localização aproximada.</li>' : ''}
${temGoat ? '<li><strong>Estatísticas:</strong> usamos o GoatCounter, que conta visitas sem cookies e sem identificar você.</li>' : ''}
<li><strong>Links de parceiros:</strong> alguns links levam a serviços parceiros e podem render uma comissão ao site. Ao clicar, vale a política de privacidade do parceiro.</li>
</ul>
</section>

<section>
<h2>Seus direitos (LGPD)</h2>
<p>Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir informações sobre o tratamento de dados, correção ou exclusão. Como o site não armazena dados pessoais, os pedidos relativos a cookies de terceiros devem ser feitos aos próprios serviços. Você também pode bloquear ou apagar cookies nas configurações do navegador.</p>
<p>Dúvidas sobre esta política podem ser enviadas ${contato}.</p>
</section>`;
  },
};
