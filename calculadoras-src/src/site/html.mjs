// Utilitários para gerar HTML no build.
import { TABELAS } from '../engine/tabelas.js';

export function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const brl = (v) => fmtBRL.format(v);
export const num = (v) => fmtNum.format(v);
export const pct = (v, casas = 1) =>
  `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v * 100)}%`;

export function dataExtensa(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(a, m - 1, d)),
  );
}

export function tabelaINSS(tabelas = TABELAS) {
  let anterior = 0;
  const linhas = tabelas.inss.faixas
    .map((f) => {
      const de = anterior === 0 ? 'Até' : `De ${brl(anterior + 0.01)} até`;
      anterior = f.ate;
      return `<tr><td>${de} ${brl(f.ate)}</td><td>${pct(f.aliquota)}</td></tr>`;
    })
    .join('');
  return `<div class="tabela-rolagem"><table>
<caption>Tabela do INSS ${tabelas.ano} (empregados, domésticos e avulsos)</caption>
<thead><tr><th scope="col">Salário de contribuição</th><th scope="col">Alíquota</th></tr></thead>
<tbody>${linhas}</tbody>
</table></div>
<p class="nota">Teto do INSS em ${tabelas.ano}: ${brl(tabelas.inss.teto)}. A alíquota é progressiva: cada percentual incide só sobre a parte do salário dentro da faixa.</p>`;
}

export function tabelaIRRF(tabelas = TABELAS) {
  let anterior = 0;
  const linhas = tabelas.irrf.faixas
    .map((f) => {
      const faixa =
        anterior === 0
          ? `Até ${brl(f.ate)}`
          : f.ate === Infinity
            ? `Acima de ${brl(anterior)}`
            : `De ${brl(anterior + 0.01)} até ${brl(f.ate)}`;
      anterior = f.ate;
      return `<tr><td>${faixa}</td><td>${f.aliquota ? pct(f.aliquota) : 'Isento'}</td><td>${f.deducao ? brl(f.deducao) : '—'}</td></tr>`;
    })
    .join('');
  const r = tabelas.irrf.reducao;
  return `<div class="tabela-rolagem"><table>
<caption>Tabela progressiva mensal do IR (base de cálculo)</caption>
<thead><tr><th scope="col">Base de cálculo</th><th scope="col">Alíquota</th><th scope="col">Parcela a deduzir</th></tr></thead>
<tbody>${linhas}</tbody>
</table></div>
<div class="tabela-rolagem"><table>
<caption>Redução do IR a partir de ${tabelas.ano} (Lei 15.270/2025)</caption>
<thead><tr><th scope="col">Rendimento tributável mensal</th><th scope="col">Redução do imposto</th></tr></thead>
<tbody>
<tr><td>Até ${brl(r.isencaoAte)}</td><td>Até ${brl(r.reducaoMaxima)} — o imposto fica zerado</td></tr>
<tr><td>De ${brl(r.isencaoAte + 0.01)} até ${brl(r.faixaParcialAte)}</td><td>${brl(r.constante)} − (${String(r.coeficiente).replace('.', ',')} × rendimento)</td></tr>
<tr><td>Acima de ${brl(r.faixaParcialAte)}</td><td>Sem redução</td></tr>
</tbody>
</table></div>
<p class="nota">Dedução por dependente: ${brl(tabelas.irrf.deducaoDependente)}. Desconto simplificado mensal: ${brl(tabelas.irrf.descontoSimplificado)} (usado quando é maior que as deduções legais).</p>`;
}
