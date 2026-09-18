/**
 * Conectores de APIs Públicas e Serviços Governamentais
 * Integrações reais e operacionais sem dados fictícios
 */

import {
  ApiPublicaInfo,
  CoordenadaGeo,
  Meteorologia,
  SipamEventoFogo,
  SipamFocoCalor,
  SipamEstatisticas,
  SipamEventoDetalhes,
  NivelRisco
} from '../types';
import { getQuadrantName } from './geoCalculations';
import { ESTADOS_BRASIL, EstadoBrasil, normalizeUf } from '../data/estadosBrasil';

export const CATALOGO_APIS_PUBLICAS: ApiPublicaInfo[] = [
  {
    id: 'sipam-painel-do-fogo',
    nome: 'SIPAM — Painel do Fogo (CENSIPAM / Ministério da Defesa)',
    orgaoOuFornecedor: 'Centro Gestor e Operacional do Sistema de Proteção da Amazônia (CENSIPAM / MD)',
    tipoDado: 'Eventos e polígonos de fogo consolidados (até 30 dias), focos CSPP e FIRMS em tempo real, sobreposição CAR, TI e UC',
    endpointUrl: '/api/sipam/eventos ou https://panorama.sipam.gov.br/painel-do-fogo/api/swagger',
    autenticacao: 'Aberta / Sem Chave',
    status: 'Ativo',
    descricao: 'API pública governamental do Ministério da Defesa que consolida detecções orbitais com delimitação de polígonos de queima, histórico de persistência até 30 dias e cruzamento imediato com imóveis do Cadastro Ambiental Rural (CAR).',
    beneficioPolicial: 'Identificação material dos limites do polígono do incêndio e listagem incontestável de matrículas rurais CAR atingidas para autoria e responsabilização penal/administrativa.'
  },
  {
    id: 'open-meteo',
    nome: 'Open-Meteo Weather API',
    orgaoOuFornecedor: 'Open-Meteo (Copernicus / ECMWF / NOAA / INMET)',
    tipoDado: 'Vento (10m), Umidade Relativa, Temperatura, Pressão e FWI em tempo real',
    endpointUrl: '/api/meteo ou https://api.open-meteo.com/v1/forecast',
    autenticacao: 'Aberta / Sem Chave',
    status: 'Ativo',
    descricao: 'API meteorológica pública e gratuita de alta precisão baseada em modelos globais e regionais com dados horários em tempo real.',
    beneficioPolicial: 'Determinação exata da velocidade e vetor do vento no instante do foco para cálculo do nexo causal e da projeção de avanço.'
  },
  {
    id: 'inpe-bdqueimadas',
    nome: 'INPE BDQueimadas',
    orgaoOuFornecedor: 'Instituto Nacional de Pesquisas Espaciais (INPE)',
    tipoDado: 'Focos de calor ativos em tempo quase real no Brasil (Satélites de Referência)',
    endpointUrl: '/api/focos-inpe → https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/ows (WFS/OGC)',
    autenticacao: 'Aberta / Sem Chave',
    status: 'Ativo',
    descricao: 'Portal oficial brasileiro de monitoramento de queimadas, consumido pelo GeoServer OGC '
      + 'do TerraBrasilis (a API REST antiga foi desativada pelo INPE). Entrega, por detecção: FRP, '
      + 'bioma, vegetação, índice de risco de fogo, dias sem chuva, município e UF. Janelas: hoje, 48h, '
      + 'mês atual, ano atual e séries históricas de 2020 a 2025. Conjunto "satref" = satélite de '
      + 'referência (série oficial citável em laudo); "todosats" = todos os satélites.',
    beneficioPolicial: 'Fonte oficial e incontestável para perícias criminais. A série histórica por ano '
      + 'permite demonstrar recorrência de queima na mesma gleba — elemento de convicção para dolo eventual.'
  },
  {
    id: 'osm-overpass',
    nome: 'OpenStreetMap Overpass API (Hidrografia e Malha Viária)',
    orgaoOuFornecedor: 'OpenStreetMap Foundation / Geodados Comunitários Validados',
    tipoDado: 'Rios, córregos, nascentes, represas, açudes e estradas vicinais/rodovias no raio do evento',
    endpointUrl: '/api/osm-overpass ou https://overpass-api.de/api/interpreter',
    autenticacao: 'Aberta / Sem Chave',
    status: 'Ativo',
    descricao: 'Consulta espacial vetorial detalhada de feições hídricas para cálculo real de APPs e vias vicinais para rotas de combate.',
    beneficioPolicial: 'Mapeamento das estradas reais para bloqueio policial e mananciais reais de captação de água para o Corpo de Bombeiros.'
  },
  {
    id: 'ibge-localidades',
    nome: 'IBGE API de Localidades e Municípios',
    orgaoOuFornecedor: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
    tipoDado: 'Municípios, Microrregiões, Comarcas e Códigos Oficiais',
    endpointUrl: '/api/ibge-municipios ou https://servicodados.ibge.gov.br/api/v1/localidades',
    autenticacao: 'Aberta / Sem Chave',
    status: 'Ativo',
    descricao: 'Base de dados oficial de municípios brasileiros, permitindo resolução automática e padronizada de comarca e jurisdição.',
    beneficioPolicial: 'Fixação imediata da competência territorial da Delegacia de Polícia e da Vara Judicial competente.'
  },
  {
    id: 'nasa-firms',
    nome: 'NASA FIRMS (Fire Information for Resource Management System)',
    orgaoOuFornecedor: 'NASA / LANCE',
    tipoDado: 'Detecções orbitais de focos de calor (VIIRS 375m / MODIS 1km) e Potência Radiativa (FRP em MW)',
    endpointUrl: '/api/focos-nasa ou https://firms.modaps.eosdis.nasa.gov/api',
    autenticacao: 'Chave Pública Gratuita',
    status: 'Ativo',
    descricao: 'Sistema global da NASA de monitoramento orbital em tempo quase real com dados de alta fidelidade e potência radiativa do fogo.',
    beneficioPolicial: 'Evidência orbital primária de datação do início da queima e persistência de anomalia térmica.'
  },
  {
    id: 'sigamgeo-semil',
    nome: 'SIGAMgeo / DATAGEO (SEMIL-SP)',
    orgaoOuFornecedor: 'Secretaria de Meio Ambiente, Infraestrutura e Logística de SP (SEMIL / CETESB)',
    tipoDado: 'WFS: AIAs (Autos de Infração Ambiental), APPs, Vegetação Nativa, UCs e CAR-SP',
    endpointUrl: '/api/sigamgeo-wfs ou https://datageo.ambiente.sp.gov.br/geoserver/wfs',
    autenticacao: 'Aberta / Sem Chave',
    status: 'Requer Credencial',
    descricao: 'Infraestrutura de Dados Espaciais Ambientais de SP. ATENÇÃO: o GeoServer do DATAGEO '
      + 'responde atualmente "Service WFS is disabled" — o serviço WFS público está desativado, e a '
      + 'camada de AIA NÃO é consultável por este canal. Cobertura restrita ao Estado de São Paulo. '
      + 'Enquanto o WFS estiver desativado, o histórico de autuação deve ser obtido por certidão junto '
      + 'à CETESB/SEMIL.',
    beneficioPolicial: 'Prova de reincidência de autuações anteriores do autuado na mesma gleba para fundamentar dolo eventual.'
  },
  {
    id: 'brasil-mais-mjsp',
    nome: 'Programa Brasil M.A.I.S (SCCON / Planet Labs)',
    orgaoOuFornecedor: 'Ministério da Justiça e Segurança Pública (SENASP / PF)',
    tipoDado: 'Mosaicos e imagens diárias de satélite PlanetScope (resolução espacial 3m)',
    endpointUrl: 'https://plataforma-brasilmais.mj.gov.br',
    autenticacao: 'Credenciamento Institucional',
    status: 'Requer Credencial',
    descricao: 'Plataforma oficial da segurança pública com imagens orbitais diárias de altíssima resolução para órgãos credenciados da federação.',
    beneficioPolicial: 'Materialidade pré e pós-incêndio incontestável, permitindo visualizar tratores, aceiros ou ausência deles.'
  }
];

/**
 * Consulta meteorologia real em tempo real via Open-Meteo
 * Tenta primeiro via endpoint proxy do servidor e depois fallback direto
 */
export async function fetchLiveMeteorology(coords: CoordenadaGeo): Promise<Meteorologia> {
  const dataConsultaUtc = new Date().toISOString();

  /**
   * Meteorologia não verificada.
   * Os campos numéricos vão zerados porque não há medição — e `confiabilidade`
   * INDISPONIVEL é o que impede que esses zeros sejam lidos como aferição.
   * O FWI fica INDETERMINADO: não se classifica risco sem dado.
   */
  const indisponivel = (motivo: string, orientacao: string): Meteorologia => ({
    ventoVelocidadeKmH: 0,
    ventoDirecaoGraus: 0,
    ventoDirecaoTexto: 'N/D',
    umidadeRelativaPercentual: 0,
    temperaturaCelsius: 0,
    pressaoHpa: 0,
    fwiIndiceRisco: 'INDETERMINADO',
    estacaoNome: 'Meteorologia não verificada',
    estacaoDistanciaKm: 0,
    fonte: `Indisponível — ${motivo}`,
    confiabilidade: 'INDISPONIVEL',
    dataConsultaUtc,
    observacoes: orientacao
  });

  let payload: any = null;

  try {
    // Somente via proxy. O navegador não fala com fonte externa diretamente:
    // isso isola credenciais, cumpre o CORS dos órgãos e mantém a consulta auditável.
    const res = await fetch(`/api/meteo?lat=${coords.lat}&lng=${coords.lng}`);
    payload = await res.json().catch(() => null);

    if (!res.ok || !payload?.sucesso) {
      return indisponivel(
        payload?.erro || `proxy retornou status ${res.status}`,
        payload?.orientacaoOperador
          || 'Meteorologia não verificada para esta coordenada. Afira vento, umidade e temperatura '
           + 'em estação de referência (INMET/CPTEC) e parametrize manualmente na reanálise pericial. '
           + 'O modelo de propagação NÃO deve ser citado no laudo enquanto esta camada estiver indisponível.'
      );
    }
  } catch (err: any) {
    return indisponivel(
      err?.message || 'falha de rede',
      'Sem conexão com o serviço meteorológico. Registre as condições aferidas em campo e '
      + 'parametrize manualmente antes de gerar o laudo.'
    );
  }

  const c = payload.current ?? {};

  // Campo ausente NÃO recebe valor plausível: se a fonte não mediu, a camada inteira
  // é declarada indisponível. Um `?? 45` de umidade aqui alteraria o humidityFactor do
  // modelo de propagação e, por consequência, a área projetada citada no laudo.
  const camposObrigatorios: Array<[string, unknown]> = [
    ['wind_speed_10m', c.wind_speed_10m],
    ['wind_direction_10m', c.wind_direction_10m],
    ['relative_humidity_2m', c.relative_humidity_2m],
    ['temperature_2m', c.temperature_2m],
    ['surface_pressure', c.surface_pressure]
  ];
  const ausentes = camposObrigatorios.filter(([, v]) => typeof v !== 'number' || !Number.isFinite(v));

  if (ausentes.length > 0) {
    return indisponivel(
      `resposta incompleta da Open-Meteo (sem ${ausentes.map(([k]) => k).join(', ')})`,
      `A fonte respondeu mas não forneceu: ${ausentes.map(([k]) => k).join(', ')}. `
      + 'Os demais parâmetros não são suficientes para classificar o risco. Afira em estação de '
      + 'referência antes de concluir o laudo.'
    );
  }

  const windSpeedKmH = Number(c.wind_speed_10m.toFixed(1));
  const windDirDeg = Math.round(c.wind_direction_10m);
  const humidity = Math.round(c.relative_humidity_2m);
  const temp = Number(c.temperature_2m.toFixed(1));
  const pressure = Math.round(c.surface_pressure);

  let fwi: NivelRisco = 'MEDIO';
  if (humidity < 20 || windSpeedKmH > 30) {
    fwi = 'CRITICO';
  } else if (humidity < 30 || windSpeedKmH > 20) {
    fwi = 'ALTO';
  } else if (humidity > 55) {
    fwi = 'BAIXO';
  }

  return {
    ventoVelocidadeKmH: windSpeedKmH,
    ventoDirecaoGraus: windDirDeg,
    ventoDirecaoTexto: getQuadrantName(windDirDeg),
    umidadeRelativaPercentual: humidity,
    temperaturaCelsius: temp,
    pressaoHpa: pressure,
    fwiIndiceRisco: fwi,
    estacaoNome: `Grade de reanálise Open-Meteo (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
    estacaoDistanciaKm: 0,
    fonte: payload.fonte || 'Open-Meteo API v1 / Modelo Global GFS-ECMWF',
    confiabilidade: 'REAL',
    dataConsultaUtc: payload.consultadoEmUtc || dataConsultaUtc,
    observacoes: 'Valores de grade de reanálise interpolada, não de estação física no local. '
      + 'Para quesito que exija medição instrumental, requisitar dados do INMET.'
  };
}

export interface FocoInpeDetalhe {
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
  frp: number | null;
  riscoFogo: number | null;
  diasSemChuva: number | null;
  precipitacao: number | null;
}

/**
 * Consulta focos de calor do INPE via GeoServer OGC (TerraBrasilis).
 *
 * `janela`: 'hoje' | '48h' | 'mesatual' | 'ano_atual' | '2020'..'2025'
 * `conjunto`: 'satref' (satélite de referência AQUA — série oficial citável em laudo)
 *             | 'todosats' (todos os satélites; volume maior, uso tático)
 */
export async function fetchFocosInpe(params: {
  estado?: string;
  lat?: number;
  lng?: number;
  raioKm?: number;
  janela?: string;
  conjunto?: 'satref' | 'todosats';
  limite?: number;
} = {}): Promise<{
  sucesso: boolean;
  fonte: string;
  camada?: string;
  quantidade: number;
  totalNaFonte?: number;
  truncado?: boolean;
  focos: FocoInpeDetalhe[];
  escopo?: string;
  mensagem?: string;
  orientacaoOperador?: string;
}> {
  const busca = new URLSearchParams();
  if (params.estado) busca.set('estado', params.estado);
  if (typeof params.lat === 'number') busca.set('lat', String(params.lat));
  if (typeof params.lng === 'number') busca.set('lng', String(params.lng));
  if (params.raioKm) busca.set('raioKm', String(params.raioKm));
  if (params.janela) busca.set('janela', params.janela);
  if (params.conjunto) busca.set('conjunto', params.conjunto);
  if (params.limite) busca.set('limite', String(params.limite));

  try {
    const res = await fetch(`/api/focos-inpe?${busca.toString()}`);
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.sucesso) {
      return {
        sucesso: false,
        fonte: json?.fonte || 'INPE BDQueimadas (GeoServer)',
        quantidade: 0,
        focos: [],
        mensagem: json?.erro || `Proxy retornou status ${res.status}`,
        orientacaoOperador: json?.orientacaoOperador
          || 'Não foi possível consultar o INPE. A ausência de focos nesta tela não significa ausência de fogo.'
      };
    }

    return {
      sucesso: true,
      fonte: json.fonte,
      camada: json.camada,
      quantidade: json.quantidade ?? 0,
      totalNaFonte: json.totalNaFonte,
      truncado: json.truncado,
      focos: Array.isArray(json.focos) ? json.focos : [],
      escopo: json.escopo,
      mensagem: json.mensagem
    };
  } catch (err: any) {
    console.warn('Erro ao consultar focos do INPE:', err.message);
    return {
      sucesso: false,
      fonte: 'INPE BDQueimadas (GeoServer)',
      quantidade: 0,
      focos: [],
      mensagem: err?.message || 'Serviço INPE indisponível.',
      orientacaoOperador: 'Não foi possível consultar o INPE. A ausência de focos nesta tela não '
        + 'significa ausência de fogo — verifique as abas SIPAM e NASA FIRMS.'
    };
  }
}

export interface AreaProtegidaInpe {
  nome: string;
  tipo: 'TERRA_INDIGENA' | 'UC_FEDERAL' | 'UC_ESTADUAL';
  orgao: string | null;
  idOficial: string | number | null;
}

/**
 * Verifica incidência da coordenada em Terra Indígena ou Unidade de Conservação,
 * por consulta espacial (INTERSECTS) contra os polígonos oficiais da FUNAI e do MMA.
 */
export async function fetchAreasProtegidas(coords: CoordenadaGeo): Promise<{
  sucesso: boolean;
  verificacaoCompleta: boolean;
  fonte: string;
  consultadoEmUtc?: string;
  areas: AreaProtegidaInpe[];
  competenciaFederalIndicada: boolean;
  mensagem?: string;
  orientacaoOperador?: string;
}> {
  try {
    const res = await fetch(`/api/inpe/areas-protegidas?lat=${coords.lat}&lng=${coords.lng}`);
    const json = await res.json().catch(() => null);

    if (!res.ok || json?.sucesso === undefined) {
      return {
        sucesso: false,
        verificacaoCompleta: false,
        fonte: json?.fonte || 'INPE / TerraBrasilis GeoServer',
        areas: [],
        competenciaFederalIndicada: false,
        mensagem: json?.erro || `Proxy retornou status ${res.status}`,
        orientacaoOperador: json?.orientacaoOperador
          || 'Incidência em Terra Indígena e Unidade de Conservação NÃO verificada. Consulte o CNUC e a FUNAI.'
      };
    }

    return {
      sucesso: Boolean(json.sucesso),
      verificacaoCompleta: Boolean(json.verificacaoCompleta),
      fonte: json.fonte,
      consultadoEmUtc: json.consultadoEmUtc,
      areas: Array.isArray(json.areas) ? json.areas : [],
      competenciaFederalIndicada: Boolean(json.competenciaFederalIndicada)
    };
  } catch (err: any) {
    console.warn('Erro ao consultar áreas protegidas:', err.message);
    return {
      sucesso: false,
      verificacaoCompleta: false,
      fonte: 'INPE / TerraBrasilis GeoServer',
      areas: [],
      competenciaFederalIndicada: false,
      mensagem: err?.message,
      orientacaoOperador: 'Incidência em Terra Indígena e Unidade de Conservação NÃO verificada. '
        + 'Consulte o CNUC (cnuc.mma.gov.br) e a FUNAI: incidência em UC federal ou TI atrai o '
        + 'Art. 40 da Lei 9.605/98 e a competência da Justiça Federal.'
    };
  }
}

/**
 * Consulta status de autenticação dos satélites (NASA FIRMS vs INPE BDQueimadas)
 */
export async function fetchSatellitesStatus(mapKey?: string): Promise<{
  nasa: {
    hasKey: boolean;
    maskedKey: string | null;
    status: string;
    provider: string;
    sensores: string[];
    requerChave: boolean;
    telemetria?: {
      transaction_limit?: number;
      current_transactions?: number;
      transaction_interval?: string;
    };
  };
  inpe: {
    hasKey: boolean;
    requerChave: boolean;
    status: string;
    provider: string;
    satelites: string[];
    descricaoAutenticacao: string;
  };
}> {
  try {
    const url = mapKey ? `/api/satellites/status?mapKey=${encodeURIComponent(mapKey)}` : '/api/satellites/status';
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar status dos satélites:', err);
  }

  return {
    nasa: {
      hasKey: false,
      maskedKey: null,
      status: 'Consulta indisponível',
      provider: 'NASA LANCE / EOSDIS',
      sensores: ['VIIRS 375m (NOAA-20)', 'MODIS 1km'],
      requerChave: true
    },
    inpe: {
      hasKey: true,
      requerChave: false,
      status: 'API Aberta e Pública (Sem necessidade de chave)',
      provider: 'INPE / MCTI (Brasil)',
      satelites: ['AQUA', 'TERRA', 'NOAA-20', 'GOES-16'],
      descricaoAutenticacao: 'Acesso governamental aberto sem token de API.'
    }
  };
}

export interface FocoNasaDetail {
  latitude: number;
  longitude: number;
  bright_ti4?: number;
  scan?: string;
  track?: string;
  acq_date?: string;
  acq_time?: string;
  satellite?: string;
  instrument?: string;
  confidence?: string;
  version?: string;
  bright_ti5?: number;
  frp?: number;
  daynight?: string;
}

/**
 * Consulta focos de satélite da NASA FIRMS (VIIRS 375m / MODIS)
 */
export async function fetchFocosNasa(params: {
  lat?: number;
  lng?: number;
  raioKm?: number;
  source?: 'VIIRS_NOAA20_NRT' | 'VIIRS_NOAA21_NRT' | 'VIIRS_SNPP_NRT' | 'MODIS_NRT';
  country?: 'BRA';
  days?: number;
  mapKey?: string;
}): Promise<{
  sucesso: boolean;
  fonte: string;
  quantidade: number;
  focos: FocoNasaDetail[];
  sensor?: string;
  escopo?: string;
  diasConsultados?: number;
  mensagem?: string;
  requerChave?: boolean;
  temChaveConfigurada?: boolean;
  chaveInvalida?: boolean;
}> {
  try {
    const search = new URLSearchParams();
    if (params.lat !== undefined) search.set('lat', params.lat.toString());
    if (params.lng !== undefined) search.set('lng', params.lng.toString());
    if (params.raioKm !== undefined) search.set('raioKm', params.raioKm.toString());
    if (params.source) search.set('source', params.source);
    if (params.country) search.set('country', params.country);
    if (params.days !== undefined) search.set('days', params.days.toString());
    if (params.mapKey) search.set('mapKey', params.mapKey);

    const res = await fetch(`/api/focos-nasa?${search.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const rawFocos = Array.isArray(data.focos) ? data.focos : [];
      const parsedFocos: FocoNasaDetail[] = rawFocos.map((it: any) => ({
        latitude: parseFloat(it.latitude || 0),
        longitude: parseFloat(it.longitude || 0),
        bright_ti4: it.bright_ti4 ? parseFloat(it.bright_ti4) : undefined,
        scan: it.scan,
        track: it.track,
        acq_date: it.acq_date,
        acq_time: it.acq_time,
        satellite: it.satellite,
        instrument: it.instrument,
        confidence: it.confidence,
        version: it.version,
        bright_ti5: it.bright_ti5 ? parseFloat(it.bright_ti5) : undefined,
        frp: it.frp ? parseFloat(it.frp) : undefined,
        daynight: it.daynight
      })).filter((f: FocoNasaDetail) => !isNaN(f.latitude) && !isNaN(f.longitude) && f.latitude !== 0);

      return {
        sucesso: data.sucesso ?? false,
        fonte: data.fonte || 'NASA FIRMS',
        quantidade: parsedFocos.length,
        focos: parsedFocos,
        sensor: data.sensor,
        escopo: data.escopo,
        diasConsultados: data.diasConsultados,
        mensagem: data.mensagem,
        requerChave: data.requerChave,
        temChaveConfigurada: data.temChaveConfigurada,
        chaveInvalida: data.chaveInvalida
      };
    }
  } catch (err: any) {
    console.warn('Erro ao consultar NASA FIRMS:', err.message);
  }

  return {
    sucesso: false,
    fonte: 'NASA FIRMS API',
    quantidade: 0,
    focos: [],
    mensagem: 'Falha ao conectar com o serviço NASA FIRMS.'
  };
}

/**
 * Consulta hidrografia real e vias rurais reais via Overpass API (OpenStreetMap)
 */
export async function fetchOsmOverpassFeatures(coords: CoordenadaGeo, raioMetros: number = 3000): Promise<{
  sucesso: boolean;
  hidrografia: Array<{ tipo: string; nome: string; detalhe: string }>;
  vias: Array<{ tipo: string; nome: string; pavimento: string }>;
  mensagem?: string;
}> {
  try {
    const res = await fetch(`/api/osm-overpass?lat=${coords.lat}&lng=${coords.lng}&raioMetros=${raioMetros}`);
    if (res.ok) {
      const data = await res.json();
      return {
        sucesso: data.sucesso ?? true,
        hidrografia: data.hidrografia || [],
        vias: data.vias || [],
        mensagem: data.mensagem
      };
    }
  } catch (err: any) {
    console.warn('Erro na consulta Overpass:', err.message);
  }

  return {
    sucesso: false,
    hidrografia: [],
    vias: [],
    mensagem: 'Consulta cartográfica OpenStreetMap indisponível'
  };
}

/**
 * Consulta a lista oficial de Unidades Federativas do Brasil
 */
export async function fetchIbgeEstados(): Promise<EstadoBrasil[]> {
  try {
    const res = await fetch('/api/ibge-estados');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((e: any) => ({
          sigla: e.sigla,
          nome: e.nome,
          codigoIbge: e.id,
          regiao: e.regiao?.nome || 'Brasil'
        })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
      }
    }
  } catch (err) {
    console.warn('Erro ao buscar estados da API, usando catálogo manual oficial:', err);
  }

  return ESTADOS_BRASIL;
}

/**
 * Consulta lista oficial de municípios de qualquer UF brasileira pela API do IBGE (com fallback BrasilAPI)
 */
export async function fetchIbgeMunicipios(uf: string = 'SP'): Promise<Array<{ id: number; nome: string; uf?: string }>> {
  // Sem UF reconhecida não há consulta possível: não presumir um estado.
  const ufLimpa = normalizeUf(uf);
  if (!ufLimpa) {
    console.warn(`UF não reconhecida na consulta de municípios: "${uf}"`);
    return [];
  }
  try {
    const res = await fetch(`/api/ibge-municipios?uf=${ufLimpa}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((m: any) => ({
          id: m.id || m.codigo_ibge,
          nome: m.nome,
          uf: ufLimpa
        })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
      }
    }
  } catch (err) {
    console.warn(`Erro ao buscar municípios do IBGE para ${ufLimpa}:`, err);
  }

  return [];
}

/**
 * Consulta dados do SIGAMgeo / DATAGEO SP
 */
export async function fetchSigamgeoWfsData(coords: CoordenadaGeo): Promise<{
  sucesso: boolean;
  fonte: string;
  registros: any[];
  mensagem?: string;
  foraDeCobertura?: boolean;
  orientacaoOperador?: string;
}> {
  try {
    const res = await fetch(`/api/sigamgeo-wfs?lat=${coords.lat}&lng=${coords.lng}`);
    const json = await res.json().catch(() => null);

    // O corpo já vem no contrato correto do proxy, inclusive nos casos de falha e de
    // fora-de-cobertura. Repassar verbatim preserva `sucesso: false`.
    if (json) return json;

    throw new Error(`Proxy retornou status ${res.status} sem corpo legível`);
  } catch (err: any) {
    console.warn('Erro ao consultar SIGAMgeo WFS:', err.message);

    // ANTES esta função devolvia `sucesso: true` com "nenhum registro associado ao ponto",
    // o que fazia uma falha de rede virar afirmação pericial de ausência de autuação —
    // e o analyzer marcava a camada como REAL.
    return {
      sucesso: false,
      fonte: 'DATAGEO / SEMIL-SP (WFS)',
      registros: [],
      mensagem: err?.message || 'Falha de comunicação com o WFS do DATAGEO.',
      orientacaoOperador: 'O histórico de Auto de Infração Ambiental NÃO foi verificado. '
        + 'Consulte datageo.ambiente.sp.gov.br ou requisite certidão à CETESB/SEMIL antes de '
        + 'afirmar ausência de reincidência no laudo.'
    };
  }
}

/**
 * Consulta nome de município e estado por coordenada via OpenStreetMap Nominatim ou IBGE
 */
export async function reverseGeocodeMunicipio(coords: CoordenadaGeo): Promise<{
  municipio: string;
  uf: string;
  comarca: string;
  identificado: boolean;
  orientacaoOperador?: string;
}> {
  // Municipio/UF/comarca não identificados. A comarca define competência jurisdicional:
  // preencher com um palpite é pior do que declarar a pendência ao operador.
  const naoIdentificado = (motivo: string) => ({
    municipio: 'NÃO IDENTIFICADO',
    uf: '',
    comarca: 'NÃO IDENTIFICADA',
    identificado: false,
    orientacaoOperador: `Geocodificação reversa indisponível (${motivo}). Informe manualmente `
      + 'município, UF e comarca competente — a comarca determina a competência jurisdicional do laudo.'
  });

  try {
    // Via proxy: o navegador não chama o Nominatim diretamente.
    const res = await fetch(`/api/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`);
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.sucesso) {
      return naoIdentificado(json?.erro || `proxy retornou status ${res.status}`);
    }

    if (!json.identificado || !json.municipio || !json.uf) {
      return naoIdentificado('o serviço respondeu mas não resolveu a localidade para esta coordenada');
    }

    const uf = normalizeUf(json.uf);
    if (!uf) {
      return naoIdentificado(`UF não reconhecida na resposta ("${json.uf}")`);
    }

    return {
      municipio: json.municipio,
      uf,
      comarca: `Comarca de ${json.municipio} - TJ${uf}`,
      identificado: true,
      // A comarca é inferida do município: nem todo município é sede de comarca.
      orientacaoOperador: 'Comarca inferida a partir do município. Confirme a comarca sede competente '
        + 'na organização judiciária do tribunal estadual antes de protocolar.'
    };
  } catch (e: any) {
    console.warn('Falha na geocodificação reversa:', e?.message);
    return naoIdentificado(e?.message || 'falha de rede');
  }
}

/**
 * Consulta status e diagnóstico do SIPAM Painel do Fogo
 */
export async function fetchSipamStatus(): Promise<{
  online: boolean;
  ping?: string;
  provedor: string;
  ministerio: string;
  swaggerUrl: string;
  requerChave: boolean;
  autenticacao: string;
  capacidades: string[];
  limiteMaximoHistoricoDias: number;
}> {
  try {
    const res = await fetch('/api/sipam/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar status do SIPAM:', err);
  }

  return {
    online: false,
    provedor: 'CENSIPAM (Centro Gestor e Operacional do Sistema de Proteção da Amazônia)',
    ministerio: 'Ministério da Defesa (MD)',
    swaggerUrl: 'https://panorama.sipam.gov.br/painel-do-fogo/api/swagger',
    requerChave: false,
    autenticacao: 'Aberta / Sem Chave',
    capacidades: ['Eventos de fogo até 30 dias', 'Focos CSPP e FIRMS', 'Sobreposição com CAR'],
    limiteMaximoHistoricoDias: 30
  };
}

/**
 * Consulta eventos de fogo ativos e em observação do SIPAM Painel do Fogo
 * Suporta filtragem temporal de até 30 dias (máximo permitido)
 */
export async function fetchSipamEventos(params: {
  uf?: string;
  dias?: number;
  municipio?: string;
  status?: string;
}): Promise<{
  sucesso: boolean;
  fonte: string;
  uf: string;
  diasConsultados: number;
  limiteMaximoConfigurado: number;
  totalEventosEstado: number;
  quantidadeFiltrada: number;
  estatisticas: SipamEstatisticas;
  eventos: SipamEventoFogo[];
  mensagem?: string;
}> {
  try {
    const search = new URLSearchParams();
    if (params.uf) search.set('sigla_estado', params.uf);
    // Limite rígido de até 30 dias
    const dias = Math.min(Math.max(params.dias || 30, 1), 30);
    search.set('dias', dias.toString());
    if (params.municipio) search.set('municipio', params.municipio);
    if (params.status && params.status !== 'todos') search.set('status', params.status);

    const res = await fetch(`/api/sipam/eventos?${search.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Erro ao consultar eventos do SIPAM:', err.message);
  }

  return {
    sucesso: false,
    fonte: 'SIPAM Painel do Fogo',
    uf: params.uf || 'SP',
    diasConsultados: params.dias || 30,
    limiteMaximoConfigurado: 30,
    totalEventosEstado: 0,
    quantidadeFiltrada: 0,
    estatisticas: {
      totalEventos: 0,
      totalAreaKm2: 0,
      mediaPersistenciaDias: 0,
      totalEmUC: 0,
      totalEmTI: 0,
      totalEmQuilombola: 0
    },
    eventos: [],
    mensagem: 'Não foi possível carregar os eventos do SIPAM no momento.'
  };
}

/**
 * Consulta focos de calor diretos (CENSIPAM antenas próprias ou FIRMS) de 1 a 24 horas
 */
export async function fetchSipamFocos(params: {
  origem?: 'censipam' | 'firms';
  horas?: number;
  estado?: string;
}): Promise<{
  sucesso: boolean;
  origem: string;
  horasConsultadas: number;
  quantidade: number;
  focos: SipamFocoCalor[];
  mensagem?: string;
}> {
  try {
    const search = new URLSearchParams();
    if (params.origem) search.set('origem', params.origem);
    if (params.horas) search.set('horas', params.horas.toString());
    if (params.estado) search.set('estado', params.estado);

    const res = await fetch(`/api/sipam/focos?${search.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Erro ao consultar focos do SIPAM:', err.message);
  }

  return {
    sucesso: false,
    origem: params.origem === 'firms' ? 'FIRMS via CENSIPAM' : 'CENSIPAM (Antenas Próprias)',
    horasConsultadas: params.horas || 12,
    quantidade: 0,
    focos: [],
    mensagem: 'Falha ao obter focos do SIPAM.'
  };
}

/**
 * Verifica se um par de coordenadas faz intersecção com algum evento de fogo ativo no SIPAM
 */
export async function fetchSipamEventoPorPosicao(coords: CoordenadaGeo): Promise<{
  sucesso: boolean;
  encontrado: boolean;
  evento?: SipamEventoFogo;
  mensagem?: string;
}> {
  try {
    const res = await fetch(`/api/sipam/evento-posicao?lat=${coords.lat}&lng=${coords.lng}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Erro ao verificar posição no SIPAM:', err.message);
  }

  return {
    sucesso: false,
    encontrado: false,
    mensagem: 'Consulta de intersecção espacial indisponível'
  };
}

/**
 * Consulta detalhes completos de um evento de fogo (detecções, propriedades CAR e prioridades)
 */
export async function fetchSipamEventoDetalhes(idEvento: number | string): Promise<SipamEventoDetalhes> {
  try {
    const res = await fetch(`/api/sipam/evento-detalhes/${idEvento}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Erro ao buscar detalhes do evento SIPAM:', err.message);
  }

  return {
    sucesso: false,
    idEvento: idEvento.toString(),
    evento: null,
    deteccoes: [],
    propriedadesCar: [],
    prioridades: []
  };
}
