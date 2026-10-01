// Gera o código "Pix copia e cola" (BR Code estático, padrão EMV do Banco Central).

function campo(id, valor) {
  return id + String(valor.length).padStart(2, '0') + valor;
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido pelo BR Code.
export function crc16(texto) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Nome e cidade do recebedor só aceitam ASCII básico no BR Code.
function semAcento(texto, max) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,@-]/g, '')
    .trim()
    .slice(0, max);
}

export function gerarPixCopiaECola({ chave, nome, cidade, valor = 0, txid = '***', mensagem = '' }) {
  if (!chave || !nome || !cidade) throw new Error('Pix: informe chave, nome e cidade do recebedor.');
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave) + (mensagem ? campo('02', mensagem.slice(0, 40)) : '');
  const payload =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor > 0 ? campo('54', valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', semAcento(nome, 25)) +
    campo('60', semAcento(cidade, 15)) +
    campo('62', campo('05', txid)) +
    '6304';
  return payload + crc16(payload);
}
