import { calcularRescisao, AVISOS_POR_TIPO } from '../../engine/index.js';
import { brl, pct, dataBR, esc, linhasTabela } from '../ui.js';

// Mostra só as opções de aviso prévio que existem para o motivo escolhido.
export function aoMudar(form, d) {
  const select = form.elements.aviso;
  const validos = AVISOS_POR_TIPO[d.tipo] ?? [];
  for (const op of select.options) {
    const ok = validos.includes(op.value);
    op.hidden = !ok;
    op.disabled = !ok;
  }
  if (validos.length && !validos.includes(select.value)) select.value = validos[0];
  select.disabled = validos.length === 0;
  select.closest('.campo').hidden = validos.length === 0;
  d.aviso = select.value;
}

export function calcular(d) {
  if (!d.salario || !d.admissao || !d.saida) return null;
  return calcularRescisao({
    salario: d.salario,
    mediasAdicionais: d.medias,
    admissao: d.admissao,
    saida: d.saida,
    tipo: d.tipo,
    aviso: d.aviso,
    feriasVencidas: Number(d.vencidas) || 0,
    saldoFGTS: d.fgts > 0 ? d.fgts : null,
    saqueAniversario: d.aniversario,
    dependentes: d.dependentes,
  });
}

export function renderizar(r, d) {
  const linhas = [
    ...r.itens.map((i) => ({
      rotulo: esc(i.descricao),
      valor: i.valor,
      desconto: i.natureza === 'desconto',
      classe: i.natureza === 'desconto' ? 'desconto' : '',
    })),
    { rotulo: 'Total líquido da rescisão', valor: r.liquido, classe: 'total' },
  ];
  const f = r.fgts;
  const linhasFGTS = [
    { rotulo: f.saldoEstimado ? 'Saldo estimado' : 'Saldo informado', valor: f.saldo },
    { rotulo: 'Depósito sobre as verbas da rescisão', valor: f.depositoRescisorio },
    f.multa > 0 && { rotulo: `Multa de ${pct(f.multaPercentual, 0)}`, valor: f.multa },
    {
      rotulo: f.saqueAniversario ? 'Liberado para saque (só a multa)' : `Liberado para saque${f.saquePercentual && f.saquePercentual < 1 ? ` (${pct(f.saquePercentual, 0)} do saldo + multa)` : ''}`,
      valor: f.saque,
      classe: 'total',
    },
  ].filter(Boolean);

  const dicas = [];
  if (r.periodosCompletos > 0 && Number(d.vencidas) === 0) {
    dicas.push(
      `Pelas datas, você completou ${r.periodosCompletos} período${r.periodosCompletos > 1 ? 's' : ''} de férias. Se não tirou as férias de algum deles, informe em “Férias vencidas”.`,
    );
  }
  if (f.saldoEstimado) dicas.push('O saldo do FGTS foi estimado pelo tempo de casa. Para um valor exato, informe o saldo do app FGTS em “FGTS e outros ajustes”.');
  if (r.seguroDesemprego) dicas.push('Você pode ter direito ao seguro-desemprego, conforme o tempo trabalhado.');

  const info = [
    `${r.anosCompletos} ano${r.anosCompletos === 1 ? '' : 's'} completo${r.anosCompletos === 1 ? '' : 's'} de empresa`,
    r.diasIndenizados > 0 ? `aviso prévio de ${r.diasAvisoProporcional} dias, com fim projetado para ${dataBR(r.fimProjetado)}` : '',
  ].filter(Boolean);

  return `
<div class="destaque">
<p class="destaque-rotulo">${esc(r.tipoNome)}: você recebe</p>
<p class="destaque-valor">${brl(r.liquido)}</p>
${f.saque > 0 ? `<p class="destaque-sub">+ ${brl(f.saque)} de FGTS para sacar</p>` : '<p class="destaque-sub">Sem saque do FGTS neste tipo de saída</p>'}
</div>
<p class="nota">${info.join(' · ')}.</p>
<table class="tabela-resultado"><caption>Verbas rescisórias</caption><tbody>${linhasTabela(linhas)}</tbody></table>
<table class="tabela-resultado"><caption>FGTS</caption><tbody>${linhasTabela(linhasFGTS)}</tbody></table>
${dicas.length ? `<ul class="avisos">${dicas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}`;
}

export function textoCompartilhar(r) {
  return `Calculei minha rescisão (${r.tipoNome.toLowerCase()}): ${brl(r.liquido)}${r.fgts.saque > 0 ? ` + ${brl(r.fgts.saque)} de FGTS` : ''}. Calcule a sua:`;
}
