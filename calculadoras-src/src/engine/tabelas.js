// Tabelas oficiais usadas por todas as calculadoras.
// Para atualizar no ano seguinte, edite SOMENTE este arquivo, rode `npm test`
// (os testes com valores conhecidos vão apontar o que mudou) e `npm run build`.

export const TABELAS = {
  ano: 2026,
  vigencia: { inicio: '2026-01-01', fim: '2026-12-31' },

  salarioMinimo: 1621.0,

  // INSS do empregado — Portaria Interministerial MPS/MF nº 13/2026.
  // Cálculo progressivo: cada alíquota incide só sobre a parcela do salário dentro da faixa.
  inss: {
    teto: 8475.55,
    faixas: [
      { ate: 1621.0, aliquota: 0.075 },
      { ate: 2902.84, aliquota: 0.09 },
      { ate: 4354.27, aliquota: 0.12 },
      { ate: 8475.55, aliquota: 0.14 },
    ],
  },

  // Sócio (pró-labore) e contribuinte individual: 11% até o teto.
  inssContribuinteIndividual: 0.11,

  // IRRF — tabela progressiva mensal da Lei nº 15.191/2025 (vigente desde maio/2025)
  // + redução da Lei nº 15.270/2025 (isenção até R$ 5.000 a partir de 01/2026).
  irrf: {
    faixas: [
      { ate: 2428.8, aliquota: 0, deducao: 0 },
      { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
      { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
      { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
      { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
    ],
    deducaoDependente: 189.59,
    descontoSimplificado: 607.2,
    // Lei 9.430/1996, art. 67: retenção de até R$ 10 é dispensada
    // (vale para rendimentos que entram na declaração anual, não para o 13º).
    dispensaRetencaoAte: 10,
    reducao: {
      isencaoAte: 5000,
      reducaoMaxima: 312.89,
      faixaParcialAte: 7350,
      // redução = 978,62 − 0,133145 × rendimento tributável mensal
      constante: 978.62,
      coeficiente: 0.133145,
    },
  },

  fgts: { aliquota: 0.08, multaSemJustaCausa: 0.4, multaAcordo: 0.2, saqueAcordo: 0.8 },

  // Simples Nacional — LC 123/2006, Anexos III e V (redação da LC 155/2016).
  // Alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12.
  simples: {
    limiteAnual: 4800000,
    sublimiteIss: 3600000,
    fatorRMinimo: 0.28,
    anexoIII: [
      { ate: 180000, aliquota: 0.06, deducao: 0 },
      { ate: 360000, aliquota: 0.112, deducao: 9360 },
      { ate: 720000, aliquota: 0.135, deducao: 17640 },
      { ate: 1800000, aliquota: 0.16, deducao: 35640 },
      { ate: 3600000, aliquota: 0.21, deducao: 125640 },
      { ate: 4800000, aliquota: 0.33, deducao: 648000 },
    ],
    anexoV: [
      { ate: 180000, aliquota: 0.155, deducao: 0 },
      { ate: 360000, aliquota: 0.18, deducao: 4500 },
      { ate: 720000, aliquota: 0.195, deducao: 9900 },
      { ate: 1800000, aliquota: 0.205, deducao: 17100 },
      { ate: 3600000, aliquota: 0.23, deducao: 62100 },
      { ate: 4800000, aliquota: 0.305, deducao: 540000 },
    ],
  },

  // Lucro Presumido para prestação de serviços (presunção de 32%).
  lucroPresumido: {
    presuncao: 0.32,
    irpj: 0.15,
    adicionalIrpj: 0.1,
    limiteAdicionalMensal: 20000,
    csll: 0.09,
    pis: 0.0065,
    cofins: 0.03,
    cppPatronal: 0.2,
  },

  // Lei 15.270/2025: retenção de 10% sobre dividendos acima de R$ 50 mil/mês
  // da mesma empresa e imposto mínimo (IRPFM) para renda anual acima de R$ 600 mil.
  altaRenda: { dividendosMensaisSemRetencao: 50000, retencaoDividendos: 0.1, irpfmRendaAnual: 600000 },

  fontes: [
    { nome: 'Portaria Interministerial MPS/MF nº 13/2026 — tabela do INSS 2026' },
    { nome: 'Lei nº 15.270/2025 — isenção de IR até R$ 5.000 e redução até R$ 7.350' },
    { nome: 'Lei nº 15.191/2025 — tabela progressiva mensal do IRRF' },
    { nome: 'Lei Complementar nº 123/2006 — Simples Nacional (Anexos III e V, Fator R)' },
    { nome: 'CLT, arts. 129 a 145 (férias), 477 a 487 (rescisão e aviso prévio) e 484-A (acordo)' },
    { nome: 'Lei nº 4.090/1962 (13º salário), Lei nº 12.506/2011 (aviso prévio proporcional) e Lei nº 8.036/1990 (FGTS)' },
  ],
};

// Indica se as tabelas ainda valem na data informada (usado para avisar o visitante).
export function tabelasVigentes(data = new Date(), tabelas = TABELAS) {
  const hoje = data.toISOString().slice(0, 10);
  return hoje >= tabelas.vigencia.inicio && hoje <= tabelas.vigencia.fim;
}
