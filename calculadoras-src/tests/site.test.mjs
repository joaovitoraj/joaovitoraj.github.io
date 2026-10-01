// Testes do gerador: páginas, SEO e blocos de monetização ligados pela configuração.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import configPadrao from '../site.config.mjs';
import { PAGINAS } from '../src/pages/index.mjs';
import { renderizarPagina } from '../src/site/layout.mjs';
import { gerarPixCopiaECola } from '../src/engine/pix.js';

function contexto(monetizacao = {}, analytics = {}) {
  const config = {
    ...configPadrao,
    monetizacao: { ...configPadrao.monetizacao, ...monetizacao },
    analytics: { ...configPadrao.analytics, ...analytics },
  };
  return {
    config,
    base: config.basePath,
    url: (slug) => `${config.siteUrl}${config.basePath}${slug}`,
    versao: { css: 'teste', js: 'teste' },
  };
}

const pagina = (slug) => PAGINAS.find((p) => p.slug === slug);

test('todas as páginas renderizam com título, h1 e canonical únicos', () => {
  const ctx = contexto();
  const titulos = new Set();
  for (const p of PAGINAS) {
    const html = renderizarPagina(p, ctx);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, p.slug);
    assert.ok(html.includes(`<link rel="canonical" href="${ctx.url(p.slug)}">`));
    titulos.add(p.titulo);
  }
  assert.equal(titulos.size, PAGINAS.length);
});

test('sem configuração de monetização, nada de anúncio, afiliado, produto ou Pix', () => {
  const html = renderizarPagina(pagina('clt-x-pj/'), contexto());
  for (const trecho of ['adsbygoogle', 'class="parceiro"', 'class="produto"', 'data-pix-codigo', 'googletagmanager', 'goatcounter']) {
    assert.ok(!html.includes(trecho), trecho);
  }
});

test('AdSense: script no head e blocos manuais quando há slots', () => {
  const ctx = contexto({ adsenseClient: 'ca-pub-1234567890123456', adsenseSlots: { aposResultado: '111', antesDoFaq: '' } });
  const html = renderizarPagina(pagina('salario-liquido/'), ctx);
  assert.ok(html.includes('adsbygoogle.js?client=ca-pub-1234567890123456'));
  assert.ok(html.includes('data-ad-slot="111"'));
  assert.equal((html.match(/<ins class="adsbygoogle"/g) ?? []).length, 1);
});

test('afiliado aparece só na CLT x PJ, com rel sponsored e aviso de comissão', () => {
  const ctx = contexto({ afiliadoContabilidade: { url: 'https://exemplo.com/?ref=1', nome: 'Contábil X', chamada: 'Abra seu CNPJ' } });
  const html = renderizarPagina(pagina('clt-x-pj/'), ctx);
  assert.ok(html.includes('href="https://exemplo.com/?ref=1" rel="sponsored noopener"'));
  assert.ok(html.includes('comissão'));
  assert.ok(!renderizarPagina(pagina('ferias/'), ctx).includes('exemplo.com'));
});

test('produto e Pix aparecem nas calculadoras quando configurados', () => {
  const pix = { chave: 'teste@exemplo.com', nome: 'João Araújo', cidade: 'Rio de Janeiro' };
  const ctx = contexto({ produto: { url: 'https://loja.exemplo/planilha', titulo: 'Planilha PJ', descricao: '', preco: 'R$ 29' }, pix });
  const html = renderizarPagina(pagina('rescisao/'), ctx);
  assert.ok(html.includes('Planilha PJ'));
  assert.ok(html.includes('Quero por R$ 29'));
  assert.ok(html.includes(gerarPixCopiaECola(pix)));
  // Páginas institucionais não recebem esses blocos.
  assert.ok(!renderizarPagina(pagina('sobre/'), ctx).includes('Planilha PJ'));
});

test('analytics e política de privacidade acompanham a configuração', () => {
  const ctx = contexto({ adsenseClient: 'ca-pub-1234567890123456' }, { ga4: 'G-ABC123', goatcounter: 'meusite' });
  assert.ok(renderizarPagina(pagina(''), ctx).includes('gtag/js?id=G-ABC123'));
  const privacidade = renderizarPagina(pagina('privacidade/'), ctx);
  assert.ok(privacidade.includes('Google AdSense'));
  assert.ok(privacidade.includes('Google Analytics'));
  assert.ok(privacidade.includes('GoatCounter'));
  assert.ok(renderizarPagina(pagina('privacidade/'), contexto()).includes('não exibe anúncios'));
});

test('JSON-LD válido com FAQ nas calculadoras', () => {
  const html = renderizarPagina(pagina('rescisao/'), contexto());
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const tipos = json['@graph'].map((n) => n['@type']);
  assert.deepEqual(tipos.sort(), ['BreadcrumbList', 'FAQPage', 'WebApplication']);
});
