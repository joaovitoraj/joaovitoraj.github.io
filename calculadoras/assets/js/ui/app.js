// Ponto de entrada no navegador: liga a calculadora da página e os recursos comuns.
import { tabelasVigentes } from '../engine/tabelas.js';
import {
  lerFormulario,
  preencherDaURL,
  atualizarURL,
  formatarDinheiro,
  caixaErros,
  debounce,
  registrarEvento,
} from './ui.js';

const VAZIO = '<p class="resultado-vazio">Preencha os campos para ver o resultado.</p>';

function iniciarCalculadora(secao, modulo) {
  const nome = secao.dataset.calculadora;
  const form = secao.querySelector('form');
  const saida = secao.querySelector('[data-resultado]');
  const barraCompartilhar = document.querySelector('[data-compartilhar]');
  const botaoWhats = barraCompartilhar?.querySelector('[data-acao="whatsapp"]');
  let ultimoResultado = null;
  let contabilizado = false;

  preencherDaURL(form);

  const atualizar = () => {
    const dados = lerFormulario(form);
    modulo.aoMudar?.(form, dados);
    let res;
    try {
      res = modulo.calcular(dados);
    } catch (erro) {
      console.error(erro);
      saida.innerHTML = caixaErros(['Não foi possível calcular com esses valores. Confira os campos.']);
      return;
    }
    ultimoResultado = null;
    if (!res) saida.innerHTML = VAZIO;
    else if (res.erros?.length) saida.innerHTML = caixaErros(res.erros);
    else {
      saida.innerHTML = modulo.renderizar(res, dados);
      ultimoResultado = { res, dados };
    }
    atualizarURL(form);
    if (barraCompartilhar) barraCompartilhar.hidden = !ultimoResultado;
    if (ultimoResultado && botaoWhats) {
      const texto = modulo.textoCompartilhar(res, dados);
      botaoWhats.href = `https://wa.me/?text=${encodeURIComponent(`${texto} ${location.href}`)}`;
    }
    if (ultimoResultado && !contabilizado) {
      contabilizado = true;
      registrarEvento('calculo', { calculadora: nome });
    }
  };

  const atualizarDepois = debounce(atualizar, 150);
  form.addEventListener('input', atualizarDepois);
  form.addEventListener('change', atualizar);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    atualizar();
    saida.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  form.querySelectorAll('[data-tipo="dinheiro"]').forEach((el) => el.addEventListener('blur', () => formatarDinheiro(el)));

  barraCompartilhar?.querySelector('[data-acao="compartilhar"]')?.addEventListener('click', async (e) => {
    if (!ultimoResultado) return;
    const texto = modulo.textoCompartilhar(ultimoResultado.res, ultimoResultado.dados);
    registrarEvento('compartilhar', { calculadora: nome });
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text: texto, url: location.href });
        return;
      }
      await navigator.clipboard.writeText(`${texto} ${location.href}`);
      e.target.textContent = 'Link copiado!';
      setTimeout(() => (e.target.textContent = 'Compartilhar resultado'), 2500);
    } catch {
      // O usuário cancelou o compartilhamento.
    }
  });
  botaoWhats?.addEventListener('click', () => registrarEvento('whatsapp', { calculadora: nome }));

  atualizar();
}

function iniciarRecursosComuns() {
  const aviso = document.querySelector('.aviso-tabelas');
  if (aviso && !tabelasVigentes(new Date())) aviso.hidden = false;

  document.querySelectorAll('[data-copiar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const alvo = document.querySelector(botao.dataset.copiar);
      if (!alvo) return;
      try {
        await navigator.clipboard.writeText(alvo.value ?? alvo.textContent);
      } catch {
        alvo.select?.();
        document.execCommand?.('copy');
      }
      const original = botao.textContent;
      botao.textContent = 'Copiado!';
      setTimeout(() => (botao.textContent = original), 2500);
    });
  });

  document.querySelectorAll('[data-evento]').forEach((link) => {
    link.addEventListener('click', () => registrarEvento('clique_parceiro', { tipo: link.dataset.evento }));
  });
}

iniciarRecursosComuns();
const secao = document.querySelector('[data-calculadora]');
if (secao) {
  import(`./calc/${secao.dataset.calculadora}.js`)
    .then((modulo) => iniciarCalculadora(secao, modulo))
    .catch((erro) => {
      console.error(erro);
      secao.querySelector('[data-resultado]').innerHTML = caixaErros([
        'Não foi possível carregar a calculadora. Recarregue a página.',
      ]);
    });
}
