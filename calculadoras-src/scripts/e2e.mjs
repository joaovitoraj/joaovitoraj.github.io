// Teste de ponta a ponta no Chromium: abre o site gerado, preenche as calculadoras e confere
// os resultados, erros de console e layout no celular. Uso: `npm run e2e [pasta-para-capturas]`.
// Requer o Playwright (global ou instalado com `npm i -D playwright`).
import path from 'node:path';
import os from 'node:os';
import { mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import config from '../site.config.mjs';
import { iniciarServidor } from './servidor.mjs';

async function carregarPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const global = execSync('npm root -g').toString().trim();
    return import(pathToFileURL(path.join(global, 'playwright', 'index.mjs')).href);
  }
}

const pastaCapturas = process.argv[2] ?? path.join(os.tmpdir(), 'calculadoras-e2e');
await mkdir(pastaCapturas, { recursive: true });

const { chromium } = await carregarPlaywright();
const porta = 8000 + Math.floor(Math.random() * 1000);
const servidor = await iniciarServidor(porta);
const base = `http://localhost:${porta}${config.basePath}`;
const navegador = await chromium.launch();
const falhas = [];

async function caso(nome, fn) {
  try {
    await fn();
    console.log(`ok   ${nome}`);
  } catch (erro) {
    falhas.push(nome);
    console.log(`FALHOU ${nome}\n     ${erro.message.split('\n').join('\n     ')}`);
  }
}

async function abrir(caminho, opcoes = {}) {
  const contexto = await navegador.newContext({ locale: 'pt-BR', ...opcoes });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  await pagina.goto(base + caminho);
  return { pagina, erros, fechar: () => contexto.close() };
}

const destaque = (p) => p.locator('.destaque-valor').first().textContent();
// O Intl usa espaço não separável depois do "R$".
const limpar = (t) => t.replace(/\s/g, ' ').trim();

await caso('salário líquido de R$ 6.000', async () => {
  const { pagina, erros, fechar } = await abrir('salario-liquido/');
  await pagina.fill('#c-salario', '6000');
  await pagina.waitForSelector('.destaque-valor');
  assert.equal(limpar(await destaque(pagina)), 'R$ 4.973,39');
  assert.match(pagina.url(), /salario=6000/);
  assert.equal(await pagina.locator('[data-compartilhar]').isVisible(), true);
  assert.match(await pagina.locator('.selo-positivo').textContent(), /179,75/);
  assert.match(await pagina.locator('[data-acao="whatsapp"]').getAttribute('href'), /^https:\/\/wa\.me\/\?text=/);
  assert.deepEqual(erros, []);
  await fechar();
});

await caso('link compartilhado já abre calculado', async () => {
  const { pagina, erros, fechar } = await abrir('salario-liquido/?salario=3000&dependentes=1');
  await pagina.waitForSelector('.destaque-valor');
  assert.equal(limpar(await destaque(pagina)), 'R$ 2.751,40');
  assert.equal(await pagina.inputValue('#c-salario'), '3.000,00');
  assert.equal(await pagina.inputValue('#c-dependentes'), '1');
  assert.deepEqual(erros, []);
  await fechar();
});

await caso('CLT x PJ', async () => {
  const { pagina, erros, fechar } = await abrir('clt-x-pj/');
  await pagina.fill('#c-contador', '300');
  await pagina.fill('#c-salario', '10000');
  await pagina.fill('#c-beneficios', '1000');
  await pagina.fill('#c-pj', '15000');
  // Espera o recálculo com todos os campos (o resultado é atualizado a cada digitação).
  await pagina.waitForFunction(() => document.querySelector('.calc-resultado')?.textContent.includes('11.496,74'));
  const texto = limpar(await pagina.locator('.calc-resultado').textContent());
  assert.match(texto, /PJ rende R\$ 38\.221,98 a mais por ano/);
  assert.match(texto, /peça pelo menos R\$ 11\.496,74/);
  assert.match(texto, /CLT de R\$ 13\.561,05/);
  assert.deepEqual(erros, []);
  await fechar();
});

await caso('rescisão sem justa causa e troca de motivo', async () => {
  const { pagina, erros, fechar } = await abrir('rescisao/');
  await pagina.fill('#c-salario', '3000');
  await pagina.fill('#c-admissao', '2023-03-10');
  await pagina.fill('#c-saida', '2026-09-25');
  await pagina.waitForSelector('.destaque-valor');
  assert.equal(limpar(await destaque(pagina)), 'R$ 11.165,29');
  assert.match(limpar(await pagina.locator('.destaque-sub').textContent()), /16\.676,80/);
  await pagina.selectOption('#c-tipo', 'justaCausa');
  await pagina.waitForFunction(() => document.querySelector('#c-aviso').closest('.campo').hidden);
  await pagina.selectOption('#c-tipo', 'pedidoDemissao');
  await pagina.selectOption('#c-aviso', 'naoCumprido');
  await pagina.waitForFunction(() => document.querySelector('.destaque-valor')?.textContent.includes('3.704,45'));
  assert.deepEqual(erros, []);
  await fechar();
});

await caso('férias com venda de 10 dias', async () => {
  const { pagina, erros, fechar } = await abrir('ferias/');
  await pagina.fill('#c-salario', '3000');
  await pagina.waitForSelector('.destaque-valor');
  assert.equal(limpar(await destaque(pagina)), 'R$ 3.631,40');
  await pagina.check('#c-vender');
  await pagina.waitForFunction(() => document.querySelector('#c-dias').value === '20');
  assert.match(limpar(await pagina.locator('.calc-resultado').textContent()), /Abono pecuniário/);
  assert.deepEqual(erros, []);
  await fechar();
});

await caso('13º salário', async () => {
  const { pagina, erros, fechar } = await abrir('decimo-terceiro/');
  await pagina.fill('#c-salario', '8000');
  await pagina.waitForSelector('.destaque-valor');
  assert.equal(limpar(await destaque(pagina)), 'R$ 6.040,64');
  const parcelas = (await pagina.locator('.parcela-valor').allTextContents()).map(limpar);
  assert.deepEqual(parcelas, ['R$ 4.000,00', 'R$ 2.040,64']);
  assert.deepEqual(erros, []);
  await fechar();
});

const PAGINAS = ['', 'salario-liquido/', 'clt-x-pj/', 'rescisao/', 'ferias/', 'decimo-terceiro/', 'sobre/', 'privacidade/'];
const EXEMPLOS = {
  'salario-liquido/': '?salario=6000',
  'clt-x-pj/': '?salario=10000&beneficios=1000&pj=15000',
  'rescisao/': '?salario=3000&admissao=2023-03-10&saida=2026-09-25',
  'ferias/': '?salario=4000',
  'decimo-terceiro/': '?salario=3200',
};

for (const p of PAGINAS) {
  await caso(`celular sem rolagem horizontal: /${p}`, async () => {
    const { pagina, erros, fechar } = await abrir(p + (EXEMPLOS[p] ?? ''), {
      viewport: { width: 375, height: 800 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await pagina.waitForLoadState('networkidle');
    const largura = await pagina.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(largura <= 375, `largura do documento: ${largura}px`);
    assert.deepEqual(erros, []);
    const nome = p.replace(/\/$/, '') || 'inicio';
    await pagina.screenshot({ path: path.join(pastaCapturas, `celular-${nome}.png`), fullPage: true });
    await fechar();
  });
}

for (const [p, q] of Object.entries(EXEMPLOS)) {
  for (const esquema of ['light', 'dark']) {
    await caso(`captura desktop ${esquema}: /${p}`, async () => {
      const { pagina, fechar } = await abrir(p + q, { viewport: { width: 1280, height: 900 }, colorScheme: esquema });
      await pagina.waitForSelector('.destaque-valor');
      await pagina.screenshot({ path: path.join(pastaCapturas, `desktop-${esquema}-${p.replace(/\/$/, '')}.png`) });
      await fechar();
    });
  }
}

await navegador.close();
servidor.close();
console.log(`\nCapturas em ${pastaCapturas}`);
if (falhas.length) {
  console.log(`${falhas.length} caso(s) falharam.`);
  process.exit(1);
}
console.log('Todos os casos passaram.');
