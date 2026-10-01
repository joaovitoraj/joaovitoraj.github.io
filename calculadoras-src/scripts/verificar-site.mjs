// Confere o site gerado: links internos, metadados de SEO, dados estruturados e sitemap.
// Uso: `npm run check` (depois de `npm run build`). Sai com erro se algo estiver quebrado.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..', config.raizDominio);
const destino = path.join(raiz, config.basePath);
const erros = [];
const avisos = [];

async function listarHtml(dir) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await listarHtml(p)));
    else if (item.name.endsWith('.html')) saida.push(p);
  }
  return saida;
}

const existe = (p) =>
  stat(p).then(
    (s) => (s.isDirectory() ? stat(path.join(p, 'index.html')).then(() => true, () => false) : true),
    () => false,
  );

const paginas = await listarHtml(destino);
const titulos = new Map();

for (const arquivo of paginas) {
  const rel = path.relative(raiz, arquivo);
  const html = await readFile(arquivo, 'utf8');
  const exigir = (cond, msg) => cond || erros.push(`${rel}: ${msg}`);

  const titulo = html.match(/<title>([^<]*)<\/title>/)?.[1];
  exigir(titulo, 'sem <title>');
  if (titulo) {
    if (titulos.has(titulo)) erros.push(`${rel}: título repetido em ${titulos.get(titulo)}`);
    titulos.set(titulo, rel);
    if (titulo.length > 75) avisos.push(`${rel}: título com ${titulo.length} caracteres (o Google costuma cortar depois de ~60).`);
  }
  const descricao = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  exigir(descricao, 'sem meta description');
  if (descricao && descricao.length > 200) avisos.push(`${rel}: descrição com ${descricao.length} caracteres.`);
  exigir(/<html lang="pt-BR">/.test(html), 'sem lang="pt-BR"');
  exigir(/<link rel="canonical" href="https?:\/\/[^"]+"/.test(html), 'sem canonical absoluto');
  exigir((html.match(/<h1[\s>]/g) ?? []).length === 1, 'precisa ter exatamente um <h1>');
  exigir(/<meta property="og:image" content="https?:\/\//.test(html), 'sem og:image absoluto');

  // Texto quebrado vindo de valores ausentes no build.
  const textoVisivel = html.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const ruim of ['undefined', 'NaN', '[object Object]', 'Infinity']) {
    if (textoVisivel.includes(ruim)) erros.push(`${rel}: contém "${ruim}"`);
  }

  for (const bloco of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(bloco[1]);
    } catch (e) {
      erros.push(`${rel}: JSON-LD inválido (${e.message})`);
    }
  }

  // Links e recursos internos precisam existir.
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    const caminho = decodeURIComponent(url.split('?')[0]);
    const alvo = caminho.startsWith('/') ? path.join(raiz, caminho) : path.join(path.dirname(arquivo), caminho);
    if (!(await existe(alvo))) erros.push(`${rel}: link quebrado para ${url}`);
  }
}

const sitemap = await readFile(path.join(destino, 'sitemap.xml'), 'utf8').catch(() => '');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) erros.push('sitemap.xml ausente ou vazio');
for (const loc of locs) {
  if (!loc.startsWith(config.siteUrl + config.basePath)) erros.push(`sitemap: URL fora do site: ${loc}`);
  const rel = loc.slice((config.siteUrl + config.basePath).length);
  if (!(await existe(path.join(destino, rel)))) erros.push(`sitemap: página inexistente ${loc}`);
}
const robots = await readFile(path.join(raiz, 'robots.txt'), 'utf8').catch(() => '');
if (!robots.includes(`Sitemap: ${config.siteUrl}${config.basePath}sitemap.xml`)) erros.push('robots.txt não aponta para o sitemap');

for (const a of avisos) console.log(`aviso: ${a}`);
if (erros.length) {
  console.error(`\n${erros.length} problema(s):\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
console.log(`OK: ${paginas.length} páginas verificadas, ${locs.length} URLs no sitemap.`);
