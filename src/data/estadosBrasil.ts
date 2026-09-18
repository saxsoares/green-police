export interface EstadoBrasil {
  sigla: string;
  nome: string;
  codigoIbge: number;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
}

/**
 * Cadastro manual oficial de todas as 27 Unidades Federativas do Brasil
 * Fonte: Instituto Brasileiro de Geografia e Estatística (IBGE)
 */
export const ESTADOS_BRASIL: EstadoBrasil[] = [
  { sigla: 'AC', nome: 'Acre', codigoIbge: 12, regiao: 'Norte' },
  { sigla: 'AL', nome: 'Alagoas', codigoIbge: 27, regiao: 'Nordeste' },
  { sigla: 'AP', nome: 'Amapá', codigoIbge: 16, regiao: 'Norte' },
  { sigla: 'AM', nome: 'Amazonas', codigoIbge: 13, regiao: 'Norte' },
  { sigla: 'BA', nome: 'Bahia', codigoIbge: 29, regiao: 'Nordeste' },
  { sigla: 'CE', nome: 'Ceará', codigoIbge: 23, regiao: 'Nordeste' },
  { sigla: 'DF', nome: 'Distrito Federal', codigoIbge: 53, regiao: 'Centro-Oeste' },
  { sigla: 'ES', nome: 'Espírito Santo', codigoIbge: 32, regiao: 'Sudeste' },
  { sigla: 'GO', nome: 'Goiás', codigoIbge: 52, regiao: 'Centro-Oeste' },
  { sigla: 'MA', nome: 'Maranhão', codigoIbge: 21, regiao: 'Nordeste' },
  { sigla: 'MT', nome: 'Mato Grosso', codigoIbge: 51, regiao: 'Centro-Oeste' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', codigoIbge: 50, regiao: 'Centro-Oeste' },
  { sigla: 'MG', nome: 'Minas Gerais', codigoIbge: 31, regiao: 'Sudeste' },
  { sigla: 'PA', nome: 'Pará', codigoIbge: 15, regiao: 'Norte' },
  { sigla: 'PB', nome: 'Paraíba', codigoIbge: 25, regiao: 'Nordeste' },
  { sigla: 'PR', nome: 'Paraná', codigoIbge: 41, regiao: 'Sul' },
  { sigla: 'PE', nome: 'Pernambuco', codigoIbge: 26, regiao: 'Nordeste' },
  { sigla: 'PI', nome: 'Piauí', codigoIbge: 22, regiao: 'Nordeste' },
  { sigla: 'RJ', nome: 'Rio de Janeiro', codigoIbge: 33, regiao: 'Sudeste' },
  { sigla: 'RN', nome: 'Rio Grande do Norte', codigoIbge: 24, regiao: 'Nordeste' },
  { sigla: 'RS', nome: 'Rio Grande do Sul', codigoIbge: 43, regiao: 'Sul' },
  { sigla: 'RO', nome: 'Rondônia', codigoIbge: 11, regiao: 'Norte' },
  { sigla: 'RR', nome: 'Roraima', codigoIbge: 14, regiao: 'Norte' },
  { sigla: 'SC', nome: 'Santa Catarina', codigoIbge: 42, regiao: 'Sul' },
  { sigla: 'SP', nome: 'São Paulo', codigoIbge: 35, regiao: 'Sudeste' },
  { sigla: 'SE', nome: 'Sergipe', codigoIbge: 28, regiao: 'Nordeste' },
  { sigla: 'TO', nome: 'Tocantins', codigoIbge: 17, regiao: 'Norte' }
];

export const ESTADO_SIGLAS_SET = new Set(ESTADOS_BRASIL.map(e => e.sigla));

export const ESTADO_MAP_BY_SIGLA: Record<string, EstadoBrasil> = ESTADOS_BRASIL.reduce(
  (acc, e) => {
    acc[e.sigla] = e;
    return acc;
  },
  {} as Record<string, EstadoBrasil>
);

export const ESTADO_MAP_BY_ID: Record<number, EstadoBrasil> = ESTADOS_BRASIL.reduce(
  (acc, e) => {
    acc[e.codigoIbge] = e;
    return acc;
  },
  {} as Record<number, EstadoBrasil>
);

/**
 * Normaliza texto de estado (sigla ou nome por extenso, com ou sem acento) para a
 * sigla oficial de 2 letras.
 *
 * Devolve string VAZIA quando não reconhece a entrada. Antes devolvia 'SP', o que
 * silenciosamente atribuía São Paulo a ocorrências de qualquer outra UF — e a UF
 * determina a consulta de focos do INPE e a comarca competente no laudo.
 */
export function normalizeUf(input?: string): string {
  if (!input) return '';
  const clean = input
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (ESTADO_SIGLAS_SET.has(clean)) {
    return clean;
  }

  // Busca por nome
  const found = ESTADOS_BRASIL.find(e => {
    const nomeNorm = e.nome
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return nomeNorm === clean || clean.includes(nomeNorm);
  });

  return found ? found.sigla : '';
}
