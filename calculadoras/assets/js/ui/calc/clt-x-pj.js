import { compararCltPj } from '../../engine/index.js';
import { brl, pct, esc, barrasComparacao, linhasTabela } from '../ui.js';

export function calcular(d) {
  if (!d.salario || !d.pj) return null;
  return compararCltPj({
    clt: {
      salario: d.salario,
      dependentes: d.dependentes,
      beneficiosMensais: d.beneficios,
      plrAnual: d.plr,
      incluirFGTS: d.fgts,
      incluirMultaFGTS: d.multa,
    },
    pj: {
      faturamentoMensal: d.pj,
      mesesFaturados: Number(d.meses) || 12,
      regime: d.regime || 'auto',
      contador: d.contador,
      outrosCustos: d.custos,
      iss: d.iss,
      dependentes: d.dependentes,
    },
  });
}

function veredito(c) {
  if (c.vencedor === 'empate') return { classe: 'empate', titulo: 'Empate: as duas opções rendem o mesmo' };
  const valor = brl(Math.abs(c.diferencaAnual));
  return c.vencedor === 'pj'
    ? { classe: 'pj', titulo: `PJ rende ${valor} a mais por ano` }
    : { classe: 'clt', titulo: `CLT rende ${valor} a mais por ano` };
}

export function renderizar(c, d) {
  const v = veredito(c);
  const pj = c.pj;
  const e = pj.escolhido;
  const meses = pj.mesesFaturados;
  const custosAnuais = e.custosFixos * 12;
  const impostosAnuais = e.impostos * meses;
  const linhasCLT = [
    { rotulo: '11 salários líquidos', valor: c.clt.liquidoMensal * 11 },
    { rotulo: 'Férias + 1/3 (líquido)', valor: c.clt.feriasLiquidas },
    { rotulo: '13º salário (líquido)', valor: c.clt.decimoLiquido },
    c.clt.fgts > 0 && { rotulo: 'FGTS depositado', valor: c.clt.fgts },
    c.clt.multa > 0 && { rotulo: 'Multa de 40% do FGTS', valor: c.clt.multa },
    c.clt.beneficios > 0 && { rotulo: 'Benefícios e PLR', valor: c.clt.beneficios },
    { rotulo: 'Total por ano', valor: c.clt.total, classe: 'total' },
  ].filter(Boolean);
  const linhasPJ = [
    { rotulo: `Faturamento (${meses} meses)`, valor: pj.receitaAnual },
    { rotulo: 'Impostos e INSS', valor: impostosAnuais, desconto: true, classe: 'desconto' },
    custosAnuais > 0 && { rotulo: 'Contador e custos (12 meses)', valor: custosAnuais, desconto: true, classe: 'desconto' },
    { rotulo: 'Total por ano', valor: pj.liquidoAnual, classe: 'total' },
  ].filter(Boolean);

  const regimes = pj.cenarios
    .map(
      (x) =>
        `<tr${x.regime === e.regime ? ' class="escolhido"' : ''}><th scope="row">${esc(x.nome)}${x.regime === e.regime ? ' <small>(usado)</small>' : ''}</th><td>${brl(x.impostos)}</td><td>${brl(x.liquido)}</td></tr>`,
    )
    .join('');
  const itensRegime = e.itens.map((i) => ({ rotulo: esc(i.descricao), valor: i.valor, desconto: true, classe: 'desconto' }));

  return `
<div class="destaque veredito veredito-${v.classe}">
<p class="destaque-rotulo">Resultado</p>
<p class="destaque-valor destaque-frase">${v.titulo}</p>
${v.classe !== 'empate' ? `<p class="destaque-sub">${brl(Math.abs(c.diferencaMensal))} por mês · ${pct(Math.abs(c.diferencaPercentual))} ${c.vencedor === 'pj' ? 'acima' : 'abaixo'} do CLT</p>` : ''}
</div>
${barrasComparacao(
  [
    { rotulo: 'CLT', valor: c.clt.total, destaque: c.vencedor === 'clt' },
    { rotulo: 'PJ', valor: pj.liquidoAnual, destaque: c.vencedor === 'pj' },
  ],
  'Dinheiro no bolso em um ano',
)}
<div class="equilibrio">
${c.pjEquilibrio ? `<p>Para empatar com essa vaga CLT, peça pelo menos <strong>${brl(c.pjEquilibrio)}</strong> por mês como PJ.</p>` : ''}
${c.cltEquivalente ? `<p>Essa proposta PJ equivale a um salário CLT de <strong>${brl(c.cltEquivalente)}</strong>.</p>` : ''}
</div>
<div class="colunas">
<table class="tabela-resultado"><caption>CLT</caption><tbody>${linhasTabela(linhasCLT)}</tbody></table>
<table class="tabela-resultado"><caption>PJ <small class="mudo">· ${esc(e.nomeCurto)}</small></caption><tbody>${linhasTabela(linhasPJ)}</tbody></table>
</div>
${pj.avisos.length ? `<ul class="avisos">${pj.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
<details class="memoria"><summary>Impostos do PJ mês a mês e comparação de regimes</summary>
<table class="tabela-resultado"><caption>${esc(e.nome)} — por mês faturado</caption><tbody>
${linhasTabela([{ rotulo: 'Nota fiscal', valor: pj.faturamentoMensal }, ...itensRegime, e.custosFixos > 0 && { rotulo: 'Contador e custos', valor: e.custosFixos, desconto: true, classe: 'desconto' }, { rotulo: 'Sobra no mês', valor: e.liquido, classe: 'total' }].filter(Boolean))}
</tbody></table>
<p class="nota">Pró-labore usado: ${brl(e.proLabore)}${e.regime === 'simplesIII' ? ' (28% do faturamento, para garantir o Fator R)' : ' (um salário mínimo)'}. O restante é distribuído como lucro, isento de IR.</p>
<div class="tabela-rolagem"><table><caption>Regimes tributários (por mês faturado)</caption>
<thead><tr><th scope="col">Regime</th><th scope="col">Impostos</th><th scope="col">Sobra</th></tr></thead>
<tbody>${regimes}</tbody></table></div>
</details>
${d.regime && d.regime !== 'auto' && e.regime !== d.regime ? '<p class="nota">O regime escolhido não se aplica a esse faturamento; usamos o Lucro Presumido.</p>' : ''}`;
}

export function textoCompartilhar(c) {
  if (c.vencedor === 'empate') return 'CLT ou PJ? Fiz a conta e deu empate. Compare a sua proposta:';
  return `CLT ou PJ? Na minha conta, ${c.vencedor.toUpperCase()} rende ${brl(Math.abs(c.diferencaAnual))} a mais por ano. Compare a sua proposta:`;
}
