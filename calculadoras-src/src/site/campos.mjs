// Campos de formulário reutilizados pelas calculadoras.
import { esc } from './html.mjs';

const ajudaAttr = (nome, ajuda) => (ajuda ? ` aria-describedby="a-${nome}"` : '');
const ajudaHtml = (nome, ajuda) => (ajuda ? `<p class="ajuda" id="a-${nome}">${ajuda}</p>` : '');

export function campoDinheiro({ nome, rotulo, ajuda = '', valor = '', placeholder = '0,00', obrigatorio = false }) {
  return `<div class="campo">
<label for="c-${nome}">${rotulo}${obrigatorio ? '' : ' <span class="opcional">(opcional)</span>'}</label>
<div class="campo-dinheiro"><span aria-hidden="true">R$</span><input id="c-${nome}" name="${nome}" type="text" inputmode="decimal" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(valor)}" data-tipo="dinheiro"${obrigatorio ? ' required' : ''}${ajudaAttr(nome, ajuda)}></div>
${ajudaHtml(nome, ajuda)}
</div>`;
}

export function campoInteiro({ nome, rotulo, ajuda = '', valor = 0, min = 0, max = 99 }) {
  return `<div class="campo campo-curto">
<label for="c-${nome}">${rotulo}</label>
<input id="c-${nome}" name="${nome}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${valor}" data-tipo="inteiro"${ajudaAttr(nome, ajuda)}>
${ajudaHtml(nome, ajuda)}
</div>`;
}

export function campoPercentual({ nome, rotulo, ajuda = '', valor = '' }) {
  return `<div class="campo campo-curto">
<label for="c-${nome}">${rotulo}</label>
<div class="campo-dinheiro campo-pct"><input id="c-${nome}" name="${nome}" type="text" inputmode="decimal" autocomplete="off" value="${esc(valor)}" data-tipo="percentual"${ajudaAttr(nome, ajuda)}><span aria-hidden="true">%</span></div>
${ajudaHtml(nome, ajuda)}
</div>`;
}

export function campoSelect({ nome, rotulo, opcoes, valor, ajuda = '' }) {
  const ops = opcoes
    .map((o) => `<option value="${esc(o.valor)}"${String(o.valor) === String(valor) ? ' selected' : ''}>${esc(o.rotulo)}</option>`)
    .join('');
  return `<div class="campo">
<label for="c-${nome}">${rotulo}</label>
<select id="c-${nome}" name="${nome}"${ajudaAttr(nome, ajuda)}>${ops}</select>
${ajudaHtml(nome, ajuda)}
</div>`;
}

export function campoData({ nome, rotulo, ajuda = '' }) {
  return `<div class="campo">
<label for="c-${nome}">${rotulo}</label>
<input id="c-${nome}" name="${nome}" type="date" min="1960-01-01" max="2099-12-31" data-tipo="data" required${ajudaAttr(nome, ajuda)}>
${ajudaHtml(nome, ajuda)}
</div>`;
}

export function campoCheckbox({ nome, rotulo, marcado = false, ajuda = '' }) {
  return `<div class="campo campo-check">
<input id="c-${nome}" name="${nome}" type="checkbox" value="1" data-tipo="booleano"${marcado ? ' checked' : ''}${ajudaAttr(nome, ajuda)}>
<label for="c-${nome}">${rotulo}</label>
${ajudaHtml(nome, ajuda)}
</div>`;
}

export function avancado(titulo, conteudo) {
  return `<details class="avancado"><summary>${titulo}</summary><div class="avancado-conteudo">${conteudo}</div></details>`;
}

export function grupo(titulo, conteudo, classe = '') {
  return `<fieldset class="grupo ${classe}"><legend>${titulo}</legend>${conteudo}</fieldset>`;
}
