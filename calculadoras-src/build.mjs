// Gera o site estático a partir de src/. Uso: `npm run build`.
// Só apaga arquivos que o próprio build gerou antes (listados em .build-manifest.json),
// então nunca toca no restante do repositório.
import { readFile, writeFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './site.config.mjs';
import { PAGINAS } from './src/pages/index.mjs';
import { renderizarPagina } from './src/site/layout.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const MANIFESTO = path.join(aqui, '.build-manifest.json');

function validarConfig() {
  const erros = [];
  if (!/^https?:\/\/[^/]+$/.test(config.siteUrl)) erros.push('siteUrl deve ser algo como https://meusite.com.br (sem barra no fim).');
  if (!config.basePath.startsWith('/') || !config.basePath.endsWith('/')) erros.push("basePath deve começar e terminar com '/'.");
  const { adsenseClient } = config.monetizacao;
  if (adsenseClient && !/^ca-pub-\d{10,20}$/.test(adsenseClient)) erros.push("adsenseClient deve ter o formato 'ca-pub-1234567890123456'.");
  if (config.analytics.ga4 && !/^G-[A-Z0-9]+$/.test(config.analytics.ga4)) erros.push("analytics.ga4 deve ter o formato 'G-XXXXXXX'.");
  const pix = config.monetizacao.pix;
  const pixPreenchidos = [pix.chave, pix.nome, pix.cidade].filter(Boolean).length;
  if (pixPreenchidos > 0 && pixPreenchidos < 3) erros.push('Para ativar o Pix, preencha chave, nome e cidade.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.atualizadoEm)) erros.push('atualizadoEm deve estar no formato AAAA-MM-DD.');
  if (erros.length) {
    console.error('Configuração inválida em site.config.mjs:\n- ' + erros.join('\n- '));
    process.exit(1);
  }
}

async function listarArquivos(dir) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await listarArquivos(p)));
    else saida.push(p);
  }
  return saida.sort();
}

const hash = (conteudo) => createHash('sha256').update(conteudo).digest('hex').slice(0, 10);

async function main() {
  validarConfig();
  const raiz = path.resolve(aqui, config.raizDominio);
  const destino = path.join(raiz, config.basePath);
  if (!destino.startsWith(raiz)) throw new Error('basePath não pode sair da raiz do domínio.');

  // Arquivos a gerar: caminho relativo à raiz do domínio → conteúdo.
  const arquivos = new Map();
  // Caminhos sempre com '/', para o manifesto ser igual em qualquer sistema operacional.
  const noSite = (rel) => path.relative(raiz, path.join(destino, rel)).split(path.sep).join('/');

  // Estáticos: CSS, JS (motor + interface) e imagens.
  const css = await readFile(path.join(aqui, 'src/styles/style.css'));
  arquivos.set(noSite('assets/style.css'), css);
  const js = [];
  for (const [origem, alvo] of [
    ['src/engine', 'assets/js/engine'],
    ['src/ui', 'assets/js/ui'],
  ]) {
    for (const arq of await listarArquivos(path.join(aqui, origem))) {
      const conteudo = await readFile(arq);
      js.push(conteudo);
      arquivos.set(noSite(path.join(alvo, path.relative(path.join(aqui, origem), arq))), conteudo);
    }
  }
  for (const arq of await listarArquivos(path.join(aqui, 'src/static'))) {
    arquivos.set(noSite(path.join('assets', path.relative(path.join(aqui, 'src/static'), arq))), await readFile(arq));
  }

  const ctx = {
    config,
    base: config.basePath,
    url: (slug) => `${config.siteUrl}${config.basePath}${slug}`,
    versao: { css: hash(css), js: hash(Buffer.concat(js)) },
  };

  for (const pagina of PAGINAS) {
    arquivos.set(noSite(path.join(pagina.slug, 'index.html')), renderizarPagina(pagina, ctx));
  }

  const urls = PAGINAS.filter((p) => p.indexar !== false)
    .map((p) => `  <url><loc>${ctx.url(p.slug)}</loc><lastmod>${config.atualizadoEm}</lastmod></url>`)
    .join('\n');
  arquivos.set(
    noSite('sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );

  arquivos.set(
    'robots.txt',
    `# Gerado por calculadoras-src/build.mjs\nUser-agent: *\nAllow: /\n\nSitemap: ${ctx.url('sitemap.xml')}\n`,
  );
  if (config.monetizacao.adsenseClient) {
    const pub = config.monetizacao.adsenseClient.replace(/^ca-/, '');
    arquivos.set('ads.txt', `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
  }

  // Remove o que o build anterior gerou e não existe mais.
  let anteriores = [];
  try {
    anteriores = JSON.parse(await readFile(MANIFESTO, 'utf8'));
  } catch {
    // Primeiro build.
  }
  for (const rel of anteriores) {
    if (!arquivos.has(rel)) await rm(path.join(raiz, rel), { force: true });
  }

  // Não sobrescreve arquivos que não foram gerados por este build (ex.: um robots.txt do portfólio).
  const protegidos = [];
  for (const rel of arquivos.keys()) {
    if (anteriores.includes(rel)) continue;
    const existe = await stat(path.join(raiz, rel)).then(
      () => true,
      () => false,
    );
    const pastaDoSite = path.relative(raiz, destino).split(path.sep).join('/');
    if (existe && !(pastaDoSite && rel.startsWith(pastaDoSite + '/'))) protegidos.push(rel);
  }
  if (protegidos.length) {
    console.error(`Estes arquivos já existem e não foram criados pelo build: ${protegidos.join(', ')}.\nApague-os ou integre o conteúdo manualmente.`);
    process.exit(1);
  }

  for (const [rel, conteudo] of arquivos) {
    const alvo = path.join(raiz, rel);
    await mkdir(path.dirname(alvo), { recursive: true });
    await writeFile(alvo, conteudo);
  }
  const lista = [...arquivos.keys()].sort();
  await writeFile(MANIFESTO, JSON.stringify(lista, null, 2) + '\n');
  console.log(`Site gerado em ${path.relative(process.cwd(), destino) || '.'}: ${PAGINAS.length} páginas, ${lista.length} arquivos.`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
