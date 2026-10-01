// Servidor estático mínimo para ver o site localmente: `npm run serve` e abra
// http://localhost:8080/calculadoras/ (serve a raiz do domínio, como o GitHub Pages).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..', config.raizDominio);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
};

export function iniciarServidor(porta = 8080) {
  const servidor = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let arquivo = path.join(raiz, decodeURIComponent(url.pathname));
      if (!arquivo.startsWith(raiz)) throw new Error('fora da raiz');
      const info = await stat(arquivo).catch(() => null);
      if (info?.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
          return res.end();
        }
        arquivo = path.join(arquivo, 'index.html');
      }
      const conteudo = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] ?? 'application/octet-stream' });
      res.end(conteudo);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado');
    }
  });
  return new Promise((resolve) => servidor.listen(porta, () => resolve(servidor)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const porta = Number(process.env.PORT) || 8080;
  await iniciarServidor(porta);
  console.log(`Abra http://localhost:${porta}${config.basePath}`);
}
