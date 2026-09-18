/**
 * Módulo de Cadeia de Custódia e Validação Criptográfica SHA-256
 * Rigor forense: o hash é SEMPRE calculado determinísticamente, nunca inventado ou aproximado.
 */

import { BlocoCustodia } from '../types';

/**
 * Converte ArrayBuffer para string hexadecimal maiúscula de 64 caracteres.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < byteArray.length; i++) {
    hex += byteArray[i].toString(16).padStart(2, '0');
  }
  return hex.toUpperCase();
}

/**
 * Fallback de SHA-256 em puro TypeScript para garantir funcionamento
 * mesmo em ambientes restritos sem Web Crypto API nativa.
 */
function sha256Fallback(str: string): string {
  // UTF-8 encoding
  const utf8 = new TextEncoder().encode(str);
  
  // Constants
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const l = utf8.length;
  const bitLen = l * 8;
  const padLen = (l % 64 < 56) ? 56 - (l % 64) : 120 - (l % 64);
  const totalLen = l + padLen + 8;
  const msg = new Uint8Array(totalLen);
  msg.set(utf8);
  msg[l] = 0x80;

  // Append length in bits (big-endian 64-bit integer)
  const view = new DataView(msg.buffer);
  view.setUint32(totalLen - 4, bitLen, false);

  const W = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = (rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3)) >>> 0;
      const s1 = (rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10)) >>> 0;
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let t = 0; t < 64; t++) {
      const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map(x => x.toString(16).padStart(8, '0')).join('').toUpperCase();
}

function rightRotate(n: number, bits: number): number {
  return ((n >>> bits) | (n << (32 - bits))) >>> 0;
}

/**
 * Calcula o hash SHA-256 de uma string de forma assíncrona ou síncrona
 */
export async function calculateSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return bufferToHex(hashBuffer);
    } catch {
      return sha256Fallback(text);
    }
  }
  return sha256Fallback(text);
}

/**
 * Versão do formato do payload canônico.
 *
 * V2 (2026-09-17): o formato V1 codificava o histórico de AIA e a presença de APP como
 * binários SIM/NAO, o que fazia uma camada NÃO VERIFICADA ser certificada pelo hash como
 * "NAO" — falsa negativa assinada criptograficamente. V2 admite NAO_VERIFICADO e lista
 * em DATA_SOURCES apenas as fontes que efetivamente responderam.
 *
 * V3 (2026-09-18): o campo `AIA_REINCIDENCIA` afirmava uma CONCLUSÃO JURÍDICA que o
 * sistema não apura — reincidência exige que o autuado seja o mesmo responsável pela
 * gleba. O que a consulta apura é a existência de autos NO ENTORNO, e o campo passa a
 * chamar-se `AIA_ENTORNO`. Acrescentado `BOI_INCENDIO` (registro oficial de incêndio).
 *
 * Blocos V1 e V2 continuam validáveis: `verifyCustodyIntegrity` recomputa o hash a
 * partir da string canônica informada, qualquer que seja a versão.
 */
export const VERSAO_CUSTODIA = 'SIMIA-CUSTODIA-V3';

/**
 * Monta o payload canônico determinístico:
 * VERSAO | STAMP_UTC | GEO_REF | CADASTRO_CAR | HISTORICO_SIGAMGEO | DATA_SOURCES | OPERATOR_ID
 */
export function buildCanonicalString(params: {
  stampUtc: string;
  geoRef: string;
  cadastroCar: string;
  historicoSigamgeo: string;
  dataSources: string;
  operatorId: string;
}): string {
  // Normalização estrita de espaços para garantir reprodutibilidade forense
  return [
    VERSAO_CUSTODIA,
    params.stampUtc.trim(),
    params.geoRef.trim(),
    params.cadastroCar.trim(),
    params.historicoSigamgeo.trim(),
    params.dataSources.trim(),
    params.operatorId.trim()
  ].join(' | ');
}

/**
 * Gera o bloco completo de custódia com hash computado
 */
export async function generateCustodyBlock(params: {
  stampUtc: string;
  geoRef: string;
  cadastroCar: string;
  historicoSigamgeo: string;
  dataSources: string;
  operatorId: string;
}): Promise<BlocoCustodia> {
  const canonicalString = buildCanonicalString(params);
  const sha256Hex = await calculateSha256(canonicalString);

  return {
    stampUtc: params.stampUtc,
    geoRef: params.geoRef,
    cadastroCar: params.cadastroCar,
    historicoSigamgeo: params.historicoSigamgeo,
    dataSources: params.dataSources,
    operatorId: params.operatorId,
    canonicalString,
    sha256Hex,
    algoritmo: 'SHA-256',
    validado: true
  };
}

/**
 * Validador forense independente:
 * Recebe o texto canônico e o hash informado, computa novamente e valida.
 */
export async function verifyCustodyIntegrity(
  canonicalString: string,
  claimedHash: string
): Promise<{
  isValid: boolean;
  computedHash: string;
  claimedHash: string;
  diffMessage?: string;
}> {
  const computedHash = await calculateSha256(canonicalString.trim());
  const normalizedClaimed = claimedHash.trim().toUpperCase();
  const isValid = computedHash === normalizedClaimed;

  return {
    isValid,
    computedHash,
    claimedHash: normalizedClaimed,
    diffMessage: isValid
      ? 'Autenticidade confirmada: o hash calculado confere exatamente com o registro de custódia.'
      : 'ALERTA DE DIVERGÊNCIA: o hash calculado difere do hash alegado. O conteúdo pode ter sido adulterado.'
  };
}
