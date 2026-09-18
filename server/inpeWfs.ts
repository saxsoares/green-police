/**
 * Integração com o GeoServer do Programa Queimadas / INPE (TerraBrasilis).
 *
 * A API REST antiga (queimadas.dgi.inpe.br/api/focos) foi desativada pelo INPE.
 * O canal atual é um GeoServer OGC padrão, que é superior para uso pericial:
 * consulta espacial real (INTERSECTS), saída GeoJSON e séries históricas por ano.
 *
 * Endpoint:  https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/ows
 * Descoberto em: portal.yaml do Programa Queimadas → "Geoserviços OGC"
 *
 * Camadas confirmadas operacionais (verificadas em 2026-09-17):
 *   dados_abertos:focos_hoje_br_{satref|todosats}
 *   dados_abertos:focos_48h_br_{satref|todosats}
 *   dados_abertos:focos_mesatual_br_{satref|todosats}
 *   dados_abertos:focos_ano_atual_br_{satref|todosats}
 *   dados_abertos:focos_<ano>_br_{satref|todosats}   (2020..2025)
 *   bdqueimadas2:ti                  — Terras Indígenas (FUNAI), 615 polígonos
 *   bdqueimadas2:uc_e_nao_reservas   — Unidades de Conservação estaduais, 644 polígonos
 *   bdqueimadas:uc_f_nao_reservas    — Unidades de Conservação federais
 *
 * `biomas_brasileiros` e `municipios` existem apenas como WMS (sem WFS), mas bioma e
 * vegetação já vêm como atributo de cada foco, o que torna a camada desnecessária.
 */

import { consultarFonte, ResultadoFonte } from './proxyFetch';

const GEOSERVER = 'https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/ows';

/**
 * "satref" = satélite de referência (AQUA tarde). É a série oficial do INPE para
 * estatística e comparação histórica — a que se cita em laudo.
 * "todosats" = todos os satélites; volume muito maior, útil para varredura tática.
 */
export type ConjuntoSatelite = 'satref' | 'todosats';
export type JanelaFocos = 'hoje' | '48h' | 'mesatual' | 'ano_atual' | string; // string = ano (2020..)

export interface FocoInpe {
  idFocoBdq: number | null;
  focoId: string | null;
  latitude: number;
  longitude: number;
  dataHoraGmt: string | null;
  satelite: string | null;
  municipio: string | null;
  estado: string | null;
  bioma: string | null;
  vegetacao: string | null;
  /** Fire Radiative Power em MW. `null` = não informado pela fonte. */
  frp: number | null;
  /** Índice de risco de fogo do INPE (0 a 1). `null` = não informado. */
  riscoFogo: number | null;
  /** Dias consecutivos sem chuva — contexto de estiagem relevante para a perícia. */
  diasSemChuva: number | null;
  precipitacao: number | null;
}

export interface AreaProtegida {
  nome: string;
  tipo: 'TERRA_INDIGENA' | 'UC_FEDERAL' | 'UC_ESTADUAL';
  orgao: string | null;
  idOficial: string | number | null;
}

const UF_NOME: Record<string, string> = {
  AC: 'ACRE', AL: 'ALAGOAS', AP: 'AMAPÁ', AM: 'AMAZONAS', BA: 'BAHIA', CE: 'CEARÁ',
  DF: 'DISTRITO FEDERAL', ES: 'ESPÍRITO SANTO', GO: 'GOIÁS', MA: 'MARANHÃO',
  MT: 'MATO GROSSO', MS: 'MATO GROSSO DO SUL', MG: 'MINAS GERAIS', PA: 'PARÁ',
  PB: 'PARAÍBA', PR: 'PARANÁ', PE: 'PERNAMBUCO', PI: 'PIAUÍ', RJ: 'RIO DE JANEIRO',
  RN: 'RIO GRANDE DO NORTE', RS: 'RIO GRANDE DO SUL', RO: 'RONDÔNIA', RR: 'RORAIMA',
  SC: 'SANTA CATARINA', SP: 'SÃO PAULO', SE: 'SERGIPE', TO: 'TOCANTINS'
};

export function nomeEstadoPorUf(uf: string): string | null {
  return UF_NOME[uf.toUpperCase()] ?? null;
}

function camadaFocos(janela: JanelaFocos, conjunto: ConjuntoSatelite): string {
  const sufixo = `br_${conjunto}`;
  if (janela === 'hoje' || janela === '48h' || janela === 'mesatual' || janela === 'ano_atual') {
    return `dados_abertos:focos_${janela}_${sufixo}`;
  }
  // Série histórica por ano
  return `dados_abertos:focos_${janela}_${sufixo}`;
}

function urlWfs(params: Record<string, string>): string {
  const q = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    outputFormat: 'application/json',
    ...params
  });
  return `${GEOSERVER}?${q.toString()}`;
}

function numeroOuNulo(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function textoOuNulo(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

/**
 * Consulta focos de calor. Filtra por bounding box (quando há coordenada) ou por UF.
 *
 * A resposta é um FeatureCollection GeoJSON; o GeoServer devolve exceção XML em caso
 * de camada inválida, então validamos o formato antes de confiar.
 */
export async function consultarFocos(params: {
  janela: JanelaFocos;
  conjunto: ConjuntoSatelite;
  uf?: string;
  bbox?: { oeste: number; sul: number; leste: number; norte: number };
  limite?: number;
}): Promise<ResultadoFonte<{ focos: FocoInpe[]; totalNaFonte: number; camada: string }>> {
  const camada = camadaFocos(params.janela, params.conjunto);
  const wfsParams: Record<string, string> = {
    typeName: camada,
    maxFeatures: String(Math.min(params.limite ?? 500, 5000))
  };

  if (params.bbox) {
    // WFS 1.0.0 com EPSG:4326 usa ordem lon,lat (interpretação legada) — confirmado
    // contra o servidor do INPE.
    const b = params.bbox;
    wfsParams.bbox = `${b.oeste},${b.sul},${b.leste},${b.norte}`;
  } else if (params.uf) {
    const nome = nomeEstadoPorUf(params.uf);
    if (!nome) {
      return {
        sucesso: false,
        erro: `UF inválida: "${params.uf}"`,
        motivo: 'FORMATO',
        fonte: 'INPE BDQueimadas (GeoServer)',
        consultadoEmUtc: new Date().toISOString()
      };
    }
    wfsParams.CQL_FILTER = `estado='${nome.replace(/'/g, "''")}'`;
  }

  const r = await consultarFonte<any>({
    url: urlWfs(wfsParams),
    fonte: `INPE BDQueimadas (GeoServer — ${camada})`,
    timeoutMs: 25000, // o GeoServer do INPE é lento em janelas grandes
    validar: d => d?.type === 'FeatureCollection' && Array.isArray(d.features)
  });

  if (!r.sucesso) return r;

  const focos: FocoInpe[] = r.dados.features
    .map((f: any) => {
      const p = f.properties ?? {};
      const coords = f.geometry?.coordinates ?? [];
      const longitude = numeroOuNulo(p.longitude ?? coords[0]);
      const latitude = numeroOuNulo(p.latitude ?? coords[1]);
      if (latitude === null || longitude === null) return null;

      return {
        idFocoBdq: numeroOuNulo(p.id_foco_bdq),
        focoId: textoOuNulo(p.foco_id),
        latitude,
        longitude,
        // Campos ausentes ficam null: nunca substituídos por valor plausível.
        dataHoraGmt: textoOuNulo(p.data_hora_gmt),
        satelite: textoOuNulo(p.satelite),
        municipio: textoOuNulo(p.municipio),
        estado: textoOuNulo(p.estado),
        bioma: textoOuNulo(p.bioma),
        vegetacao: textoOuNulo(p.vegetacao),
        // FRP exatamente 0 numa detecção de fogo é fisicamente implausível: sensores que
        // não calculam potência radiativa (METOP, alguns geoestacionários) devolvem 0.
        // Tratamos como NÃO INFORMADO para não afirmar uma medição que não foi feita.
        frp: numeroOuNulo(p.frp) === 0 ? null : numeroOuNulo(p.frp),
        riscoFogo: numeroOuNulo(p.risco_fogo),
        diasSemChuva: numeroOuNulo(p.numero_dias_sem_chuva),
        precipitacao: numeroOuNulo(p.precipitacao)
      } as FocoInpe;
    })
    .filter((f: FocoInpe | null): f is FocoInpe => f !== null);

  return {
    sucesso: true,
    dados: {
      focos,
      totalNaFonte: numeroOuNulo(r.dados.totalFeatures) ?? focos.length,
      camada
    },
    fonte: r.fonte,
    consultadoEmUtc: r.consultadoEmUtc
  };
}

const CAMADAS_PROTEGIDAS: Array<{
  camada: string;
  tipo: AreaProtegida['tipo'];
  campoId: string;
}> = [
  { camada: 'bdqueimadas2:ti', tipo: 'TERRA_INDIGENA', campoId: 'id_ti' },
  { camada: 'bdqueimadas:uc_f_nao_reservas', tipo: 'UC_FEDERAL', campoId: 'id_ucf' },
  { camada: 'bdqueimadas2:uc_e_nao_reservas', tipo: 'UC_ESTADUAL', campoId: 'id_uce' }
];

/**
 * Determina se a coordenada incide em Terra Indígena ou Unidade de Conservação.
 *
 * Isto é consulta espacial de verdade (INTERSECTS contra o polígono oficial), não
 * inferência. Substitui a camada que o sistema antes preenchia com `afetada: false`
 * sem consultar nada — negativa falsa que suprimia o Art. 40 da Lei 9.605/98 e podia
 * mascarar a competência da Justiça Federal.
 */
export async function consultarAreasProtegidas(
  lat: number,
  lng: number
): Promise<{
  sucesso: boolean;
  consultadoEmUtc: string;
  fonte: string;
  areas: AreaProtegida[];
  competenciaFederalIndicada: boolean;
  camadasConsultadas: string[];
  camadasComFalha: Array<{ camada: string; erro: string }>;
}> {
  const consultadoEmUtc = new Date().toISOString();
  const ponto = `POINT(${lng} ${lat})`;

  const resultados = await Promise.all(
    CAMADAS_PROTEGIDAS.map(async def => {
      const r = await consultarFonte<any>({
        url: urlWfs({
          typeName: def.camada,
          CQL_FILTER: `INTERSECTS(geom,${ponto})`,
          maxFeatures: '10'
        }),
        fonte: `INPE GeoServer — ${def.camada}`,
        timeoutMs: 20000,
        validar: d => d?.type === 'FeatureCollection' && Array.isArray(d.features)
      });
      return { def, r };
    })
  );

  const areas: AreaProtegida[] = [];
  const camadasComFalha: Array<{ camada: string; erro: string }> = [];

  for (const { def, r } of resultados) {
    if (!r.sucesso) {
      camadasComFalha.push({ camada: def.camada, erro: r.erro });
      continue;
    }
    for (const f of r.dados.features) {
      const p = f.properties ?? {};
      areas.push({
        nome: textoOuNulo(p.nome) ?? '(sem nome na fonte)',
        tipo: def.tipo,
        orgao: textoOuNulo(p.ong),
        idOficial: p[def.campoId] ?? null
      });
    }
  }

  return {
    // Sucesso parcial não é sucesso: se alguma camada falhou, o operador precisa saber
    // que a verificação está incompleta antes de concluir pela não incidência.
    sucesso: camadasComFalha.length === 0,
    consultadoEmUtc,
    fonte: 'INPE / TerraBrasilis GeoServer (FUNAI, MMA)',
    areas,
    competenciaFederalIndicada: areas.some(
      a => a.tipo === 'TERRA_INDIGENA' || a.tipo === 'UC_FEDERAL'
    ),
    camadasConsultadas: CAMADAS_PROTEGIDAS.map(c => c.camada),
    camadasComFalha
  };
}
