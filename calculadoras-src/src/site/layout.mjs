// Monta o HTML completo de cada página.
import { esc, dataExtensa } from './html.mjs';
import { TABELAS } from '../engine/tabelas.js';
import { gerarPixCopiaECola } from '../engine/pix.js';

export const NAV = [
  { slug: 'salario-liquido/', rotulo: 'Salário líquido' },
  { slug: 'clt-x-pj/', rotulo: 'CLT x PJ' },
  { slug: 'rescisao/', rotulo: 'Rescisão' },
  { slug: 'ferias/', rotulo: 'Férias' },
  { slug: 'decimo-terceiro/', rotulo: '13º salário' },
];

const textoPuro = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function jsonLd(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

export function blocoAnuncio(ctx, nome) {
  const { adsenseClient, adsenseSlots } = ctx.config.monetizacao;
  const slot = adsenseSlots?.[nome];
  if (!adsenseClient || !slot) return '';
  return `<aside class="anuncio" aria-label="Publicidade">
<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(adsenseClient)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</aside>`;
}

export function blocoAfiliadoContabilidade(ctx) {
  const a = ctx.config.monetizacao.afiliadoContabilidade;
  if (!a?.url) return '';
  return `<aside class="parceiro">
<p class="parceiro-rotulo">Parceiro</p>
<p class="parceiro-chamada">${esc(a.chamada)}</p>
<a class="botao" href="${esc(a.url)}" rel="sponsored noopener" target="_blank" data-evento="afiliado-contabilidade">Conhecer ${esc(a.nome || 'a contabilidade online')}</a>
<p class="nota">Link de parceiro: se você contratar, o site pode receber uma comissão, sem custo extra para você.</p>
</aside>`;
}

export function blocoProduto(ctx) {
  const p = ctx.config.monetizacao.produto;
  if (!p?.url || !p?.titulo) return '';
  return `<aside class="produto">
<p class="parceiro-rotulo">Material completo</p>
<h2>${esc(p.titulo)}</h2>
${p.descricao ? `<p>${esc(p.descricao)}</p>` : ''}
<a class="botao" href="${esc(p.url)}" rel="noopener" target="_blank" data-evento="produto">${p.preco ? `Quero por ${esc(p.preco)}` : 'Quero conhecer'}</a>
</aside>`;
}

function blocoPix(ctx) {
  const pix = ctx.config.monetizacao.pix;
  if (!pix?.chave || !pix?.nome || !pix?.cidade) return '';
  const codigo = gerarPixCopiaECola(pix);
  return `<aside class="pix">
<p><strong>As calculadoras te ajudaram?</strong> O site é gratuito e se mantém com apoio voluntário.</p>
<div class="pix-linha"><input type="text" readonly value="${esc(codigo)}" aria-label="Código Pix copia e cola" data-pix-codigo>
<button type="button" class="botao botao-secundario" data-copiar="[data-pix-codigo]">Copiar Pix</button></div>
</aside>`;
}

function cabecaMonetizacao(ctx) {
  const { monetizacao, analytics, googleSiteVerification } = ctx.config;
  const partes = [];
  if (googleSiteVerification) partes.push(`<meta name="google-site-verification" content="${esc(googleSiteVerification)}">`);
  if (monetizacao.adsenseClient) {
    partes.push(
      `<meta name="google-adsense-account" content="${esc(monetizacao.adsenseClient)}">`,
      `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(monetizacao.adsenseClient)}" crossorigin="anonymous"></script>`,
    );
  }
  if (analytics.ga4) {
    partes.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(analytics.ga4)}"></script>`,
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(analytics.ga4)}');</script>`,
    );
  }
  if (analytics.goatcounter) {
    partes.push(
      `<script data-goatcounter="https://${esc(analytics.goatcounter)}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`,
    );
  }
  return partes.join('\n');
}

function schema(pagina, ctx) {
  const url = ctx.url(pagina.slug);
  const grafo = [];
  const trilha = [{ nome: 'Início', url: ctx.url('') }];
  if (pagina.slug) trilha.push({ nome: pagina.migalha ?? pagina.h1, url });
  grafo.push({
    '@type': 'BreadcrumbList',
    itemListElement: trilha.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.nome, item: t.url })),
  });
  if (!pagina.slug) {
    grafo.push({ '@type': 'WebSite', name: ctx.config.nome, url, inLanguage: 'pt-BR', description: pagina.descricao });
  }
  if (pagina.calculadora) {
    grafo.push({
      '@type': 'WebApplication',
      name: pagina.h1,
      url,
      description: pagina.descricao,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Qualquer navegador',
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      author: { '@type': 'Person', name: ctx.config.autor.nome, url: ctx.config.autor.url },
      dateModified: ctx.config.atualizadoEm,
    });
  }
  if (pagina.faq?.length) {
    grafo.push({
      '@type': 'FAQPage',
      mainEntity: pagina.faq.map((f) => ({
        '@type': 'Question',
        name: f.p,
        acceptedAnswer: { '@type': 'Answer', text: textoPuro(f.r) },
      })),
    });
  }
  return jsonLd({ '@context': 'https://schema.org', '@graph': grafo });
}

export function renderizarPagina(pagina, ctx) {
  const { config, base, versao } = ctx;
  const url = ctx.url(pagina.slug);
  const ogImagem = `${ctx.url('')}assets/og.png`;
  const nav = NAV.map(
    (n) => `<li><a href="${base}${n.slug}"${n.slug === pagina.slug ? ' aria-current="page"' : ''}>${esc(n.rotulo)}</a></li>`,
  ).join('');
  const faq = pagina.faq?.length
    ? `<section class="faq" aria-labelledby="faq-titulo">
<h2 id="faq-titulo">Perguntas frequentes</h2>
${pagina.faq.map((f) => `<details><summary>${esc(f.p)}</summary><div>${f.r}</div></details>`).join('\n')}
</section>`
    : '';
  const relacionadas = pagina.calculadora
    ? `<nav class="relacionadas" aria-label="Outras calculadoras"><h2>Outras calculadoras</h2><ul>${NAV.filter((n) => n.slug !== pagina.slug)
        .map((n) => `<li><a href="${base}${n.slug}">${esc(n.rotulo)}</a></li>`)
        .join('')}</ul></nav>`
    : '';
  const migalhas = pagina.slug
    ? `<nav class="migalhas" aria-label="Você está em"><a href="${base}">Início</a> <span aria-hidden="true">›</span> <span>${esc(pagina.migalha ?? pagina.h1)}</span></nav>`
    : '';
  const calculadora = pagina.formulario
    ? `<section class="calc" data-calculadora="${esc(pagina.calculadora)}" aria-label="Calculadora">
<form class="calc-form" novalidate>${pagina.formulario(ctx)}</form>
<div class="calc-resultado" data-resultado aria-live="polite"><p class="resultado-vazio">Preencha os campos para ver o resultado.</p></div>
<noscript><p class="aviso">Ative o JavaScript do navegador para usar a calculadora.</p></noscript>
</section>
<div class="compartilhar" data-compartilhar hidden>
<button type="button" class="botao botao-secundario" data-acao="compartilhar">Compartilhar resultado</button>
<a class="botao botao-secundario" data-acao="whatsapp" href="#" target="_blank" rel="noopener">Enviar no WhatsApp</a>
</div>`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pagina.titulo)}</title>
<meta name="description" content="${esc(pagina.descricao)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${pagina.indexar === false ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(config.nome)}">
<meta property="og:title" content="${esc(pagina.titulo)}">
<meta property="og:description" content="${esc(pagina.descricao)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImagem}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f9f9f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d0d0d" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}assets/style.css?v=${versao.css}">
<link rel="modulepreload" href="${base}assets/js/ui/app.js?v=${versao.js}">
${schema(pagina, ctx)}
${cabecaMonetizacao(ctx)}
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
<header class="topo">
<div class="topo-interno">
<a class="marca" href="${base}"><span class="marca-icone" aria-hidden="true">R$</span>${esc(config.nome)}</a>
<nav aria-label="Calculadoras"><ul class="menu">${nav}</ul></nav>
</div>
</header>
<main id="conteudo" class="pagina${pagina.calculadora ? ' pagina-calculadora' : ''}">
<p class="aviso aviso-tabelas" data-vigencia-fim="${TABELAS.vigencia.fim}" hidden>Atenção: estas calculadoras usam as tabelas de ${TABELAS.ano}. Os valores podem ter mudado.</p>
${migalhas}
<header class="cabecalho-pagina">
<h1>${esc(pagina.h1)}</h1>
${pagina.lead ? `<p class="lead">${pagina.lead}</p>` : ''}
${pagina.calculadora ? `<p class="atualizado">Tabelas de ${TABELAS.ano} · atualizado em ${dataExtensa(config.atualizadoEm)}</p>` : ''}
</header>
${calculadora}
${pagina.calculadora ? blocoAnuncio(ctx, 'aposResultado') : ''}
${pagina.depoisDaCalculadora ? pagina.depoisDaCalculadora(ctx) : ''}
<div class="conteudo">
${pagina.conteudo(ctx)}
</div>
${pagina.calculadora ? blocoProduto(ctx) : ''}
${pagina.calculadora ? blocoAnuncio(ctx, 'antesDoFaq') : ''}
${faq}
${relacionadas}
${pagina.calculadora ? blocoPix(ctx) : ''}
</main>
<footer class="rodape">
<div class="rodape-interno">
<p><strong>${esc(config.nome)}</strong> — ${esc(config.slogan)}.</p>
<p>Os resultados são estimativas baseadas na legislação vigente em ${TABELAS.ano} e não substituem a orientação de um contador ou advogado trabalhista. Os cálculos são feitos no seu navegador: nada do que você digita é enviado a servidores.</p>
<p><a href="${base}sobre/">Sobre e metodologia</a> · <a href="${base}privacidade/">Privacidade</a> · Feito por <a href="${esc(config.autor.url)}">${esc(config.autor.nome)}</a></p>
</div>
</footer>
<script type="module" src="${base}assets/js/ui/app.js?v=${versao.js}"></script>
</body>
</html>
`;
}
