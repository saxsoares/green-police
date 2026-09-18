/**
 * Integração com o SIGAMgeo PÚBLICO — SEMIL / Governo do Estado de São Paulo.
 *
 * Substitui o canal antigo (datageo.ambiente.sp.gov.br/geoserver/wfs), cujo serviço
 * WFS está desativado na origem ("Service WFS is disabled") e que, por isso, nunca
 * retornou um único auto de infração.
 *
 * Canal atual: ArcGIS Server do portal SIGAMGEO-PÚBLICO.
 *   https://mapas.semil.sp.gov.br/server/rest/services/...
 *
 * NOTA SOBRE O HOST. O portal também responde em
 * `mapas.infraestruturameioambiente.sp.gov.br`, mas o certificado TLS daquele host é
 * emitido para `*.semil.sp.gov.br` — há incompatibilidade de nome e o Node recusa a
 * conexão. `mapas.semil.sp.gov.br` serve exatamente o mesmo conteúdo com certificado
 * válido, então é o host usado aqui. Nenhuma verificação de TLS é desabilitada: num
 * sistema que produz prova, aceitar certificado inválido abriria caminho para
 * interceptação do dado pericial.
 *
 * Camadas em uso (descobertas no webmap 9db55297d8594688ad95baa7465877e6):
 *   SIPAI/SIPAI_AIA_LocalOcorrencia_PUBLICO — Autos de Infração Ambiental lavrados
 *       pela Polícia Ambiental. 571.769 registros. Ponto.
 *   SIPAI/SIPAI_BOI_AREA_PUBLICO — Boletins de Ocorrência de Incêndio florestal,
 *       com o POLÍGONO da área atingida. 1.383 registros.
 *       ATENÇÃO: o campo `AreaAbrangida` NÃO é área em hectares — é categórico
 *       ("Dentro" / "Entorno (Zona de Amortecimento)") e informa se o incêndio
 *       alcançou unidade de conservação. A área em si teria de vir da geometria
 *       do polígono, que este sistema ainda não calcula.
 *
 * COBERTURA: exclusivamente o Estado de São Paulo.
 */

import { consultarFonte, ResultadoFonte } from './proxyFetch';

const ARCGIS = 'https://mapas.semil.sp.gov.br/server/rest/services';

const CAMADA_AIA = `${ARCGIS}/SIPAI/SIPAI_AIA_LocalOcorrencia_PUBLICO/MapServer/0`;
const CAMADA_BOI_AREA = `${ARCGIS}/SIPAI/SIPAI_BOI_AREA_PUBLICO/MapServer/0`;

/** Bounding box continental aproximado do Estado de São Paulo. */
export function dentroDeSaoPaulo(lat: number, lng: number): boolean {
  return lat >= -25.4 && lat <= -19.7 && lng >= -53.2 && lng <= -44.1;
}

export interface AutoInfracaoAmbiental {
  numeroProcesso: string | null;
  anoProcesso: string | null;
  dataInfracaoUtc: string | null;
  infracao: string | null;
  classeInfracao: string | null;
  natureza: string | null;
  municipio: string | null;
  situacao: string | null;
  valorMulta: number | null;
  areaDegradadaHa: number | null;
  numeroBoletim: string | null;
  /** LGPD: nome do autuado é dado pessoal — nunca sai deste módulo por extenso. */
  autuadoAnonimizado: string | null;
  distanciaMetros: number | null;
}

export interface BoletimIncendio {
  numeroBoi: string | null;
  anoBoi: string | null;
  dataDeteccaoUtc: string | null;
  municipio: string | null;
  unidade: string | null;
  orgaoGestor: string | null;
  categoria: string | null;
  /**
   * NÃO é área em hectares. É campo CATEGÓRICO do órgão, com valores
   * "Dentro", "Entorno (Zona de Amortecimento)" ou ambos — indica se o incêndio
   * atingiu unidade de conservação ou sua zona de amortecimento.
   * Relevante para o Art. 40 da Lei 9.605/98.
   */
  abrangenciaUnidade: string | null;
  caracterizacaoArea: string | null;
  especificacaoLocal: string | null;
}

function texto(v: unknown): string | null {
  if (typeof v !== 'string') return v === null || v === undefined ? null : String(v);
  const t = v.trim();
  return t === '' ? null : t;
}

function numero(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Campos Date do ArcGIS vêm em epoch milissegundos. */
function dataIso(v: unknown): string | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Anonimiza o autuado para exibição.
 *
 * O nome consta de camada pública de transparência, mas é dado pessoal de titular
 * identificado. O sistema exibe apenas a forma reduzida; a identificação plena se dá
 * pelo NÚMERO DO PROCESSO, que a autoridade policial requisita formalmente — mesma
 * regra já aplicada ao titular do imóvel no CAR.
 */
function anonimizar(nome: unknown): string | null {
  const n = texto(nome);
  if (!n) return null;
  const partes = n.split(/\s+/).filter(Boolean);
  if (partes.length === 1) return `${partes[0].slice(0, 1)}***`;
  return `${partes[0]} ${partes.slice(1).map(p => `${p.slice(0, 1)}.`).join(' ')}`;
}

function urlConsulta(camada: string, params: Record<string, string>): string {
  const q = new URLSearchParams({ f: 'json', ...params });
  return `${camada}/query?${q.toString()}`;
}

function metrosEntre(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = (bLat - aLat) * 111320;
  const dLng = (bLng - aLng) * 111320 * Math.cos((aLat * Math.PI) / 180);
  return Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
}

/**
 * Autos de Infração Ambiental num raio em torno da coordenada.
 *
 * O RAIO É DECLARADO ao chamador e precisa aparecer no laudo: "reincidência" só tem
 * sentido pericial se a distância considerada estiver explícita.
 */
export async function consultarAia(params: {
  lat: number;
  lng: number;
  raioMetros: number;
  limite?: number;
}): Promise<ResultadoFonte<{ autos: AutoInfracaoAmbiental[]; totalNoRaio: number; truncado: boolean }>> {
  const limite = Math.min(params.limite ?? 50, 200);

  const base = {
    geometry: `${params.lng},${params.lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(params.raioMetros),
    units: 'esriSRUnit_Meter'
  };

  // Contagem primeiro: permite declarar truncamento em vez de silenciá-lo.
  const contagem = await consultarFonte<any>({
    url: urlConsulta(CAMADA_AIA, { ...base, returnCountOnly: 'true' }),
    fonte: 'SIGAMgeo Público — AIA (SEMIL/Polícia Ambiental)',
    timeoutMs: 25000,
    validar: d => typeof d?.count === 'number'
  });
  if (!contagem.sucesso) return contagem;

  const total = contagem.dados.count as number;

  const r = await consultarFonte<any>({
    url: urlConsulta(CAMADA_AIA, {
      ...base,
      outFields: [
        'NumeroProcesso', 'AnoProcesso', 'DataInfracao', 'Infracao', 'ClasseInfracao',
        'Natureza', 'Municipio', 'Situacao', 'ValMulta', 'ValMultaFinal',
        'AreaDegEmb', 'NumeroBoletim', 'NomeAutuado'
      ].join(','),
      returnGeometry: 'true',
      orderByFields: 'DataInfracao DESC',
      resultRecordCount: String(limite)
    }),
    fonte: 'SIGAMgeo Público — AIA (SEMIL/Polícia Ambiental)',
    timeoutMs: 25000,
    validar: d => Array.isArray(d?.features)
  });
  if (!r.sucesso) return r;

  const autos: AutoInfracaoAmbiental[] = r.dados.features.map((f: any) => {
    const a = f.attributes ?? {};
    const g = f.geometry ?? {};
    const gx = numero(g.x);
    const gy = numero(g.y);
    return {
      numeroProcesso: texto(a.NumeroProcesso),
      anoProcesso: texto(a.AnoProcesso),
      dataInfracaoUtc: dataIso(a.DataInfracao),
      infracao: texto(a.Infracao),
      classeInfracao: texto(a.ClasseInfracao),
      natureza: texto(a.Natureza),
      municipio: texto(a.Municipio),
      situacao: texto(a.Situacao),
      valorMulta: numero(a.ValMultaFinal) ?? numero(a.ValMulta),
      areaDegradadaHa: numero(a.AreaDegEmb),
      numeroBoletim: texto(a.NumeroBoletim),
      autuadoAnonimizado: anonimizar(a.NomeAutuado),
      distanciaMetros:
        gx !== null && gy !== null ? metrosEntre(params.lat, params.lng, gy, gx) : null
    };
  });

  autos.sort((x, y) => (x.distanciaMetros ?? 1e9) - (y.distanciaMetros ?? 1e9));

  return {
    sucesso: true,
    dados: { autos, totalNoRaio: total, truncado: total > autos.length },
    fonte: r.fonte,
    consultadoEmUtc: r.consultadoEmUtc
  };
}

/**
 * Boletins de Ocorrência de Incêndio florestal cujo polígono alcança a coordenada.
 *
 * É registro OFICIAL de incêndio lavrado pelo órgão — distinto, portanto, da projeção
 * do modelo de propagação, que é estimativa. NÃO traz área queimada em hectares.
 */
export async function consultarBoiIncendio(params: {
  lat: number;
  lng: number;
  raioMetros: number;
  limite?: number;
}): Promise<ResultadoFonte<{ boletins: BoletimIncendio[]; total: number }>> {
  const r = await consultarFonte<any>({
    url: urlConsulta(CAMADA_BOI_AREA, {
      geometry: `${params.lng},${params.lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      outSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: String(params.raioMetros),
      units: 'esriSRUnit_Meter',
      outFields: [
        'NumBOI', 'AnoBOI', 'DataHoraDeteccao', 'NomMunicipio', 'NomUnidade',
        'OrgaoGestor', 'Categoria', 'AreaAbrangida', 'CaracArea', 'EspecifLocal'
      ].join(','),
      returnGeometry: 'false',
      resultRecordCount: String(Math.min(params.limite ?? 25, 100))
    }),
    fonte: 'SIGAMgeo Público — BOI Incêndios Florestais (SEMIL)',
    timeoutMs: 25000,
    validar: d => Array.isArray(d?.features)
  });
  if (!r.sucesso) return r;

  const boletins: BoletimIncendio[] = r.dados.features.map((f: any) => {
    const a = f.attributes ?? {};
    return {
      // NumBOI já vem no formato "0010/2019" — o ano NÃO deve ser concatenado de novo.
      numeroBoi: texto(a.NumBOI),
      anoBoi: texto(a.AnoBOI),
      dataDeteccaoUtc: dataIso(a.DataHoraDeteccao),
      municipio: texto(a.NomMunicipio),
      unidade: texto(a.NomUnidade),
      orgaoGestor: texto(a.OrgaoGestor),
      categoria: texto(a.Categoria),
      abrangenciaUnidade: texto(a.AreaAbrangida),
      caracterizacaoArea: texto(a.CaracArea),
      especificacaoLocal: texto(a.EspecifLocal)
    };
  });

  return {
    sucesso: true,
    dados: { boletins, total: boletins.length },
    fonte: r.fonte,
    consultadoEmUtc: r.consultadoEmUtc
  };
}
