// Configuração do site. Depois de editar, rode `npm run build` (ou peça ao Claude).
// Tudo que está vazio ('') fica desligado e não aparece no site.

export default {
  nome: 'Salário na Real',
  slogan: 'Calculadoras de salário, CLT e PJ atualizadas para 2026',

  // Endereço público. Ao comprar um domínio próprio, troque siteUrl (ex.: 'https://salarionareal.com.br')
  // e, se o site passar a ocupar a raiz do domínio, use basePath: '/'.
  siteUrl: 'https://joaovitoraj.github.io',
  basePath: '/calculadoras/',
  // Pasta (relativa a este arquivo) publicada na raiz do domínio — onde ficam robots.txt e ads.txt.
  raizDominio: '..',

  // Data exibida como "atualizado em" e usada no sitemap. Atualize ao revisar o conteúdo.
  atualizadoEm: '2026-10-01',

  autor: {
    nome: 'João Vitor Araújo',
    descricao: 'Cientista de dados',
    url: 'https://joaovitoraj.github.io/',
  },
  // E-mail de contato exibido na página "Sobre" (recomendado para aprovação no AdSense).
  contatoEmail: '',

  monetizacao: {
    // Google AdSense: cole o ID do editor (ex.: 'ca-pub-1234567890123456').
    // Só com isso os anúncios automáticos já funcionam e o ads.txt é gerado.
    adsenseClient: '',
    // Opcional: IDs de blocos de anúncio manuais. Vazios = só anúncios automáticos.
    adsenseSlots: { aposResultado: '', antesDoFaq: '' },

    // Link de afiliado de contabilidade online / abertura de CNPJ (aparece na calculadora CLT x PJ).
    afiliadoContabilidade: {
      url: '',
      nome: '',
      chamada: 'Vai virar PJ? Abra seu CNPJ e tenha contador por um preço fixo mensal.',
    },

    // Produto próprio (planilha, e-book, consultoria). Aparece no fim das calculadoras.
    produto: { url: '', titulo: '', descricao: '', preco: '' },

    // Apoio via Pix (botão "copia e cola"). Preencha os três campos para ativar.
    pix: { chave: '', nome: '', cidade: '' },
  },

  analytics: {
    // Google Analytics 4 (ex.: 'G-XXXXXXXXXX').
    ga4: '',
    // GoatCounter, alternativa sem cookies (ex.: 'meusite' para meusite.goatcounter.com).
    goatcounter: '',
  },

  // Código de verificação do Google Search Console (só o valor do content="...").
  googleSiteVerification: '',
};
