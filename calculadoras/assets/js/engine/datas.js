// Datas de calendário em UTC (sem fuso), no formato 'AAAA-MM-DD'.

const DIA_MS = 86400000;

export function parseData(valor) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime())
      ? null
      : new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor ?? '').trim());
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const d = new Date(Date.UTC(ano, mes, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes || d.getUTCDate() !== dia) return null;
  return d;
}

export function formatarISO(d) {
  return d.toISOString().slice(0, 10);
}

export function diasNoMes(ano, mes0) {
  return new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();
}

export function addDias(d, n) {
  return new Date(d.getTime() + n * DIA_MS);
}

// Soma meses mantendo o dia (limitado ao último dia do mês de destino).
export function addMeses(d, n) {
  const total = d.getUTCMonth() + n;
  const ano = d.getUTCFullYear() + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  const dia = Math.min(d.getUTCDate(), diasNoMes(ano, mes));
  return new Date(Date.UTC(ano, mes, dia));
}

// Dias corridos entre duas datas, contando as duas pontas.
export function diasInclusivos(inicio, fim) {
  return Math.round((fim.getTime() - inicio.getTime()) / DIA_MS) + 1;
}

// Anos completos de serviço entre a admissão e o último dia trabalhado (inclusive).
export function anosCompletos(inicio, fim) {
  const limite = addDias(fim, 1);
  let anos = 0;
  while (addMeses(inicio, 12 * (anos + 1)) <= limite) anos++;
  return anos;
}

// Meses completos entre duas datas (último dia inclusive).
export function mesesCompletos(inicio, fim) {
  const limite = addDias(fim, 1);
  let meses = 0;
  while (addMeses(inicio, meses + 1) <= limite) meses++;
  return meses;
}
