// Gera a imagem de compartilhamento (1200×630) usada no WhatsApp, Facebook e LinkedIn.
// Uso: `npm run og` (requer o Playwright). O PNG fica em src/static/og.png.
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import config from '../site.config.mjs';
import { TABELAS } from '../src/engine/tabelas.js';

async function carregarPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const global = execSync('npm root -g').toString().trim();
    return import(pathToFileURL(path.join(global, 'playwright', 'index.mjs')).href);
  }
}

const aqui = path.dirname(fileURLToPath(import.meta.url));
const destino = path.join(aqui, '..', 'src', 'static', 'og.png');

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#f9f9f7;color:#0b0b0b;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
.marca{display:flex;align-items:center;gap:18px;font-size:34px;font-weight:700}
.icone{width:64px;height:64px;border-radius:16px;background:#1c5cab;color:#fff;display:grid;place-items:center;font-size:26px;font-weight:800}
h1{font-size:72px;line-height:1.05;letter-spacing:-0.02em;max-width:980px}
h1 span{color:#1c5cab}
.lista{display:flex;gap:14px;flex-wrap:wrap}
.lista b{background:#fff;border:2px solid #e1e0d9;border-radius:999px;padding:10px 22px;font-size:26px;font-weight:600;color:#52514e}
</style></head><body>
<div class="marca"><div class="icone">R$</div>${config.nome}</div>
<h1>Quanto cai na sua conta em ${TABELAS.ano}? <span>Calcule em segundos.</span></h1>
<div class="lista"><b>Salário líquido</b><b>CLT x PJ</b><b>Rescisão</b><b>Férias</b><b>13º</b></div>
</body></html>`;

const { chromium } = await carregarPlaywright();
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html);
await pagina.screenshot({ path: destino });
await navegador.close();
console.log(`Imagem gerada em ${path.relative(process.cwd(), destino)}`);
