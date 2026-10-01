import { TABELAS } from './tabelas.js';
import { arred } from './dinheiro.js';

export function faixaIRRF(base, tabelas = TABELAS) {
  return tabelas.irrf.faixas.find((f) => base <= f.ate);
}

// Redução da Lei 15.270/2025. Usa o rendimento tributável BRUTO do mês
// (não a base de cálculo) e nunca passa do imposto calculado pela tabela.
export function reducaoLei15270(rendimento, impostoTabela, tabelas = TABELAS) {
  const r = tabelas.irrf.reducao;
  let limite = 0;
  if (rendimento <= r.isencaoAte) limite = r.reducaoMaxima;
  else if (rendimento <= r.faixaParcialAte) limite = arred(r.constante - r.coeficiente * rendimento);
  return arred(Math.min(impostoTabela, Math.max(0, limite)));
}

/**
 * Imposto de renda retido na fonte.
 * tipo: 'mensal' (salário, férias) ou 'exclusiva' (13º salário — tributado à parte,
 * sem a dispensa de retenção de até R$ 10).
 * Usa automaticamente o mais vantajoso entre deduções legais e desconto simplificado.
 */
export function calcularIRRF(
  { rendimento, inss = 0, dependentes = 0, pensao = 0, previdenciaPrivada = 0, tipo = 'mensal', aplicarReducao = true },
  tabelas = TABELAS,
) {
  const t = tabelas.irrf;
  const rend = Math.max(0, rendimento);
  const deducoesLegais = arred(inss + dependentes * t.deducaoDependente + pensao + previdenciaPrivada);
  const usaSimplificado = t.descontoSimplificado > deducoesLegais;
  const deducao = usaSimplificado ? t.descontoSimplificado : deducoesLegais;
  const base = arred(Math.max(0, rend - deducao));
  const faixa = faixaIRRF(base, tabelas);
  const impostoTabela = arred(Math.max(0, base * faixa.aliquota - faixa.deducao));
  const reducao = aplicarReducao ? reducaoLei15270(rend, impostoTabela, tabelas) : 0;
  let imposto = arred(impostoTabela - reducao);
  let dispensado = false;
  if (tipo === 'mensal' && imposto > 0 && imposto <= t.dispensaRetencaoAte) {
    imposto = 0;
    dispensado = true;
  }
  return {
    rendimento: arred(rend),
    deducoesLegais,
    usaSimplificado,
    deducao,
    base,
    aliquota: faixa.aliquota,
    impostoTabela,
    reducao,
    imposto,
    dispensado,
    aliquotaEfetiva: rend > 0 ? imposto / rend : 0,
  };
}
