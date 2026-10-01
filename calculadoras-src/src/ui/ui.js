// Funções compartilhadas pela interface das calculadoras (roda no navegador).
import { paraNumero } from '../engine/dinheiro.js';

const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const brl = (v) => fmtBRL.format(v);
export const pct = (v, casas = 1) =>
  `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v * 100)}%`;
export const dataBR = (iso) => iso.split('-').reverse().join('/');

export function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Lê os campos do formulário já convertidos para o tipo certo.
export function lerFormulario(form) {
  const dados = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    const tipo = el.dataset.tipo;
    if (tipo === 'booleano') dados[el.name] = el.checked;
    else if (tipo === 'dinheiro') dados[el.name] = paraNumero(el.value);
    else if (tipo === 'percentual') dados[el.name] = paraNumero(el.value) / 100;
    else if (tipo === 'inteiro') dados[el.name] = Math.max(0, Math.min(Number(el.max) || 99, Math.floor(Number(el.value) || 0)));
    else dados[el.name] = el.value;
  }
  return dados;
}

const valorPadrao = (el) => (el.type === 'checkbox' ? el.defaultChecked : el.tagName === 'SELECT' ? padraoSelect(el) : el.defaultValue);
function padraoSelect(el) {
  const op = [...el.options].find((o) => o.defaultSelected) ?? el.options[0];
  return op?.value ?? '';
}

export function formatarDinheiro(el) {
  const n = paraNumero(el.value);
  el.value = n > 0 ? fmtNum.format(n) : '';
}

// Preenche os campos com os valores do link (?salario=5000&dependentes=1).
export function preencherDaURL(form) {
  const params = new URLSearchParams(location.search);
  let algum = false;
  for (const el of form.elements) {
    if (!el.name || !params.has(el.name)) continue;
    const v = params.get(el.name);
    algum = true;
    if (el.type === 'checkbox') el.checked = v === '1';
    else if (el.dataset.tipo === 'dinheiro') {
      el.value = v;
      formatarDinheiro(el);
    } else if (el.dataset.tipo === 'percentual') el.value = v.replace('.', ',');
    else el.value = v;
  }
  if (algum) form.querySelectorAll('details.avancado').forEach((d) => {
    if ([...d.querySelectorAll('[name]')].some((el) => params.has(el.name))) d.open = true;
  });
}

// Mantém na URL só o que difere do padrão, para o link de compartilhamento ficar curto.
export function atualizarURL(form) {
  const params = new URLSearchParams();
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    const atual = el.type === 'checkbox' ? el.checked : el.value;
    if (String(atual) === String(valorPadrao(el))) continue;
    if (el.type === 'checkbox') params.set(el.name, el.checked ? '1' : '0');
    else if (el.dataset.tipo === 'dinheiro') {
      const n = paraNumero(el.value);
      if (n > 0) params.set(el.name, String(n));
    } else if (el.value !== '') params.set(el.name, el.value);
  }
  const qs = params.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

// Barra empilhada "para onde vai o dinheiro" + legenda com valores (a tabela abaixo é a visão completa).
export function barraComposicao(partes, titulo) {
  const total = partes.reduce((s, p) => s + Math.max(0, p.valor), 0);
  if (total <= 0) return '';
  const visiveis = partes.filter((p) => p.valor > 0);
  const segmentos = visiveis
    .map((p) => {
      const largura = (p.valor / total) * 100;
      return `<span class="seg ${p.classe}" style="flex-basis:${largura.toFixed(3)}%" title="${esc(p.rotulo)}: ${brl(p.valor)} (${pct(p.valor / total)})"></span>`;
    })
    .join('');
  const legenda = visiveis
    .map(
      (p) =>
        `<li><span class="amostra ${p.classe}" aria-hidden="true"></span>${esc(p.rotulo)} <strong>${brl(p.valor)}</strong> <span class="mudo">${pct(p.valor / total)}</span></li>`,
    )
    .join('');
  return `<figure class="composicao"><figcaption>${esc(titulo)}</figcaption><div class="barra" role="img" aria-label="${esc(
    visiveis.map((p) => `${p.rotulo}: ${pct(p.valor / total)}`).join(', '),
  )}">${segmentos}</div><ul class="legenda">${legenda}</ul></figure>`;
}

// Barras horizontais para comparar dois ou mais totais; a vencedora fica em destaque.
export function barrasComparacao(itens, titulo) {
  const max = Math.max(...itens.map((i) => i.valor), 0);
  if (max <= 0) return '';
  const linhas = itens
    .map((i) => {
      const largura = Math.max(0, (i.valor / max) * 100);
      return `<div class="comp-linha"><span class="comp-rotulo">${esc(i.rotulo)}</span><span class="comp-trilho"><span class="comp-barra${i.destaque ? ' comp-destaque' : ''}" style="width:${largura.toFixed(2)}%" title="${esc(i.rotulo)}: ${brl(i.valor)}"></span></span><span class="comp-valor">${brl(i.valor)}</span></div>`;
    })
    .join('');
  return `<figure class="comparacao"><figcaption>${esc(titulo)}</figcaption>${linhas}</figure>`;
}

export function linhasTabela(itens) {
  return itens
    .map((i) => {
      const classe = i.classe ? ` class="${i.classe}"` : '';
      const valor = i.texto ?? `${i.desconto ? '− ' : ''}${brl(i.valor)}`;
      return `<tr${classe}><th scope="row">${i.rotulo}${i.detalhe ? ` <small>${i.detalhe}</small>` : ''}</th><td>${valor}</td></tr>`;
    })
    .join('');
}

export function caixaErros(erros) {
  return `<div class="erros" role="alert"><ul>${erros.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function registrarEvento(nome, parametros = {}) {
  try {
    if (typeof window.gtag === 'function') window.gtag('event', nome, parametros);
    if (window.goatcounter?.count) window.goatcounter.count({ path: `evento-${nome}`, event: true });
  } catch {
    // Estatística nunca pode quebrar a calculadora.
  }
}
