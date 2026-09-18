/**
 * Tipos e interfaces fundamentais do SIMIA-Verde (SENASP)
 * Sistema Integrado de Monitoramento, Inteligência Ambiental e Resposta a Queimadas
 */

export type ConfiabilidadeDado = 'REAL' | 'SIMULADO' | 'INDISPONIVEL';

export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type TipoEntrada = 'COORDENADA' | 'UTM' | 'GEOJSON' | 'KML' | 'ALERTA_FIRMS';

export interface CoordenadaGeo {
  lat: number;
  lng: number;
}

export interface CoordenadaUTM {
  easting: number;
  northing: number;
  zone: number;
  hemisphere: 'S' | 'N';
}

export interface OcorrenciaInput {
  id: string; // SIMIA-YYYYMMDD-XXXX
  timestampUtc: string; // ISO-8601
  operadorId: string; // ex: PCSP-001, CBMSP-042
  tipoEntrada: TipoEntrada;
  coordenadas: CoordenadaGeo;
  municipio: string;
  uf: string;
  comarca: string;
  origemDescricao?: string;
  autorizacaoQueimadaStatus: 'NAO_LOCALIZADA' | 'INDISPONIVEL_VERIFICACAO_MANUAL' | 'AUTORIZADA';
  autorizacaoQueimadaDetalhe: string;
}

export interface ItemContexto<T> {
  valor: T;
  fonte: string;
  camada?: string;
  confiabilidade: ConfiabilidadeDado;
  dataConsultaUtc: string;
  observacoes?: string;
}

export interface ContextoAmbiental {
  // SIGAMgeo / SEMIL-SP
  aia: ItemContexto<{
    historicoEncontrado: boolean;
    quantidadeRegistros: number;
    detalhes: Array<{
      numeroAia: string;
      dataAutuacao: string;
      infracao: string;
      valorMulta?: string;
      reincidencia: boolean;
    }>;
  }>;
  app: ItemContexto<{
    /** Sobreposição efetivamente MEDIDA. Presença de curso d'água no raio não é sobreposição. */
    sobreposicao: boolean;
    tipoApp: string;
    /** Distância em metros. `-1` = não medida por este sistema. */
    distanciaMetros: number;
    cursoDaguaNome?: string;
  }>;
  vegetacaoNativa: ItemContexto<{
    bioma: string; // 'Mata Atlântica', 'Cerrado'
    estagioSucessional: 'Pioneiro' | 'Médio' | 'Avançado' | 'Primário' | 'Não florestal/Agrícola';
    fitofisionomia: string;
    leiAplicavel: string;
  }>;
  unidadeConservacao: ItemContexto<{
    afetada: boolean;
    tipoUC: 'PI' | 'US' | 'ZA' | 'NENHUMA'; // Proteção Integral, Uso Sustentável, Zona de Amortecimento
    nomeUC?: string;
    distanciaKm: number;
  }>;
  car: ItemContexto<{
    inscrito: boolean;
    codigoCar: string;
    status: 'Ativo' | 'Pendente' | 'Cancelado' | 'Não localizado';
    areaPropriedadeHa: number;
    reservaLegalHa: number;
    titularAnonimizado: string; // Respeito à LGPD na exibição inicial
  }>;
}

export interface FocoCalorSatelite {
  satelite: string; // 'VIIRS (NOAA-20)', 'VIIRS (S-NPP)', 'MODIS (Aqua)'
  sensor: string;
  /** Fire Radiative Power em MW. `undefined` = não informado pela fonte (≠ zero medido). */
  frpMw?: number;
  confianca: string; // 'nominal', 'high', '95%'
  /** Horário da detecção orbital. `undefined` = não informado pela fonte. */
  dataHoraUtc?: string;
  /** Distância do foco à coordenada da ocorrência. `-1` = não aplicável/não medida. */
  distanciaMetrosFoco: number;
}

export interface Meteorologia {
  ventoVelocidadeKmH: number;
  ventoDirecaoGraus: number; // 0-360
  ventoDirecaoTexto: string; // 'NW', 'SE', 'N'
  umidadeRelativaPercentual: number; // 10-100%
  temperaturaCelsius: number;
  pressaoHpa: number;
  /** `INDETERMINADO` quando não houve medição: não se classifica risco sem dado. */
  fwiIndiceRisco: NivelRisco | 'INDETERMINADO';
  estacaoNome: string;
  estacaoDistanciaKm: number;
  fonte: string;
  confiabilidade: ConfiabilidadeDado;
  dataConsultaUtc: string;
  observacoes?: string;
}

export interface ManchaElipse {
  tempoHoras: 1 | 3 | 6;
  areaHectares: number;
  perimetroKm: number;
  eixoMaiorMetros: number;
  eixoMenorMetros: number;
  azimutePropagacaoGraus: number;
  coordenadasPoligono: CoordenadaGeo[]; // Polígono elíptico para Leaflet/GeoJSON
}

export interface ProjecaoPropagacao {
  modeloBase: string; // 'Rothermel / Elipse de Alexander'
  nivelRisco: NivelRisco;
  taxaPropagacaoMetrosHora: number;
  intensidadeEstimadaKwM: number;
  manchas: {
    t1h: ManchaElipse;
    t3h: ManchaElipse;
    t6h: ManchaElipse;
  };
  alvosCriticosNoRaio: string[];
  ressalvaForense: string;
}

export interface DiretrizesTaticas {
  bombeiros: {
    vetorAvanco: string;
    pontosContencao: string[];
    hidrografiaApoio: string[];
    rotasEvacuacao: string[];
    riscoEstrutural: string;
  };
  policiamentoOstensivo: {
    viasVicinaisControle: string[];
    pontosBloqueioSugeridos: string[];
    alertaMuralhaPaulistaLPR: string;
    orientacaoSegurancaPerimetro: string;
  };
  policiaAmbiental: {
    coordenadaPontoOrigem: string;
    verificacaoMaquinario: string;
    confrontoHistoricoAia: string;
    orientacaoColetaVestigios: string;
  };
}

export interface TipificacaoItem {
  diploma: string;
  artigo: string;
  conduta: string;
  penaOuSancao: string;
}

export interface InstrucaoForense {
  teseAutoriaDolo: {
    classificacao: 'Dolo Direto (Evidenciado)' | 'Dolo Eventual (Assunção de Risco Proibido)' | 'Culpa Grave / Imprudência' | 'Indeterminado / Em Apuração';
    fundamentacao: string;
    reincidenciaAia: boolean;
    omissaoAceirosRegulamentares: boolean;
  };
  tipificacaoPenalPreliminar: TipificacaoItem[];
  tipificacaoAdministrativa: TipificacaoItem[];
  ressalvaPreliminaridade: string;
  imagensBrasilMais: {
    disponibilidadePlanetScope3m: 'DISPONIVEL_NO_PORTAL_MJSP' | 'EM_PROCESSAMENTO' | 'INDISPONIVEL';
    janelaPreEvento: string;
    janelaPosEvento: string;
    instrucaoRequisicao: string;
  };
}

export interface BlocoCustodia {
  stampUtc: string;
  geoRef: string;
  cadastroCar: string;
  historicoSigamgeo: string;
  dataSources: string;
  operatorId: string;
  canonicalString: string;
  sha256Hex: string;
  algoritmo: 'SHA-256';
  validado: boolean;
}

export interface OcorrenciaCompleta {
  input: OcorrenciaInput;
  contexto: ContextoAmbiental;
  focosSat: FocoCalorSatelite[];
  meteo: Meteorologia;
  projecao: ProjecaoPropagacao;
  diretrizes: DiretrizesTaticas;
  forense: InstrucaoForense;
  custodia: BlocoCustodia;
}

export interface ApiPublicaInfo {
  id: string;
  nome: string;
  orgaoOuFornecedor: string;
  tipoDado: string;
  endpointUrl: string;
  autenticacao: 'Aberta / Sem Chave' | 'Chave Pública Gratuita' | 'Credenciamento Institucional';
  status: 'Ativo' | 'Preparado / Integrável' | 'Requer Credencial';
  descricao: string;
  beneficioPolicial: string;
}

export interface SipamEventoFogo {
  id_evento: number;
  status_evento: string; // 'Ativo' | 'Em observação'
  dt_minima: string;
  dt_maxima: string;
  dt_ultima_visao: string;
  persistencia_dias: number;
  area_total_evento: number; // km²
  latitude: number;
  longitude: number;
  dominio?: string | null;
  pais?: string;
  municipio?: string | null;
  terra_indigena?: string | null;
  unidade_conservacao?: string | null;
  quilombola?: string | null;
  projeto_assentamento?: string | null;
  geom?: any;
  retangulo_envolvente?: any;
}

export interface SipamFocoCalor {
  id: number;
  lat: number;
  lng: number;
  satelite: string;
  frp?: number;
  confidence?: string;
  dt_aquisicao: string;
  bright_ti4?: number;
  bright_ti5?: number;
  daynight?: string;
}

export interface SipamEstatisticas {
  totalEventos: number;
  totalAreaKm2: number;
  mediaPersistenciaDias: number;
  totalEmUC: number;
  totalEmTI: number;
  totalEmQuilombola: number;
}

export interface SipamEventoDetalhes {
  sucesso: boolean;
  idEvento: string;
  evento: SipamEventoFogo | null;
  deteccoes: Array<{
    id_deteccoes: string;
    dt_aquisicao: string;
    satelite: string;
    npontos: number;
    frp_avg?: number;
    geom?: any;
  }>;
  propriedadesCar: Array<{
    cod_imovel: string;
    municipio: string;
    estado: string;
    geom?: any;
  }>;
  prioridades: Array<{
    dt_maxima: string;
    indice: number;
    area_influencia: number;
    duracao_evento: number;
    propagacao: number;
  }>;
}

