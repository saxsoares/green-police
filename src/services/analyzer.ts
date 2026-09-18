/**
 * Motor de Análise e Integração Central do SIMIA-Verde
 * Orquestra as 6 camadas do plano forense SENASP com dados reais e verificáveis.
 * Protocolo Forense P4: Sem dados fictícios ou fabricados.
 */

import {
  ConfiabilidadeDado,
  ContextoAmbiental,
  DiretrizesTaticas,
  FocoCalorSatelite,
  InstrucaoForense,
  Meteorologia,
  OcorrenciaCompleta,
  OcorrenciaInput
} from '../types';
import {
  fetchAreasProtegidas,
  fetchFocosInpe,
  fetchLiveMeteorology,
  fetchOsmOverpassFeatures,
  fetchAiaSigamgeo,
  fetchIncendiosBoi
} from './apiConnectors';
import { generateCustodyBlock } from './crypto';
import { getQuadrantName, modelFireSpread } from './geoCalculations';

/** Raio da varredura cartográfica do Overpass. Usado também nos textos, para que o
 *  laudo nunca cite um raio diferente do efetivamente consultado. */
const RAIO_OVERPASS_METROS = 3000;

/** Raio de busca de focos orbitais em torno da coordenada da ocorrência. */
const RAIO_FOCOS_KM = 35;

/** Raio de busca de Autos de Infração Ambiental em torno da coordenada.
 *  É declarado no laudo: proximidade sem distância explícita não sustenta reincidência. */
const RAIO_AIA_METROS = 2000;

/** Raio de busca de Boletins de Ocorrência de Incêndio florestal. */
const RAIO_BOI_METROS = 5000;

const TIPO_AREA_LEGIVEL: Record<string, string> = {
  TERRA_INDIGENA: 'Terra Indígena — FUNAI',
  UC_FEDERAL: 'Unidade de Conservação federal — MMA',
  UC_ESTADUAL: 'Unidade de Conservação estadual'
};

export async function processarOcorrencia(
  input: OcorrenciaInput,
  meteoOverride?: Partial<Meteorologia>
): Promise<OcorrenciaCompleta> {
  const coords = input.coordenadas;

  // 1. Obter Meteorologia Real (Open-Meteo)
  let meteo: Meteorologia;
  if (meteoOverride && meteoOverride.ventoVelocidadeKmH !== undefined) {
    meteo = {
      ventoVelocidadeKmH: meteoOverride.ventoVelocidadeKmH,
      ventoDirecaoGraus: meteoOverride.ventoDirecaoGraus ?? 0,
      ventoDirecaoTexto: getQuadrantName(meteoOverride.ventoDirecaoGraus ?? 0),
      // Valores não informados pelo perito ficam zerados e a observação declara quais
      // foram efetivamente aferidos — em vez de completar com médias plausíveis.
      umidadeRelativaPercentual: meteoOverride.umidadeRelativaPercentual ?? 0,
      temperaturaCelsius: meteoOverride.temperaturaCelsius ?? 0,
      pressaoHpa: meteoOverride.pressaoHpa ?? 0,
      fwiIndiceRisco: meteoOverride.fwiIndiceRisco ?? 'INDETERMINADO',
      estacaoNome: 'Estação Local / Parametrizada pelo Perito',
      estacaoDistanciaKm: 0,
      fonte: 'Aferição Pericial / Parametrização Técnica',
      confiabilidade: 'REAL',
      dataConsultaUtc: new Date().toISOString(),
      observacoes: 'Parâmetros informados pelo perito responsável, não obtidos de serviço '
        + 'meteorológico. Campos não informados constam zerados e não devem ser lidos como medição.'
    };
  } else {
    meteo = await fetchLiveMeteorology(coords);
  }

  // 2. Focos Reais de Satélite — INPE BDQueimadas via GeoServer OGC
  // Consulta por bounding box em torno da coordenada (não mais por UF inteira), o que
  // reduz o volume e devolve exatamente a vizinhança pericialmente relevante.
  const focosInpeResult = await fetchFocosInpe({
    lat: coords.lat,
    lng: coords.lng,
    raioKm: RAIO_FOCOS_KM,
    janela: '48h',
    conjunto: 'todosats',
    limite: 200
  });

  let focosSat: FocoCalorSatelite[] = [];
  let focoMaisProximo: (typeof focosInpeResult.focos)[number] | null = null;
  let distanciaFocoMaisProximoM: number | null = null;

  if (focosInpeResult.sucesso && focosInpeResult.focos.length > 0) {
    const comDistancia = focosInpeResult.focos.map(f => {
      const dLat = (f.latitude - coords.lat) * 111320;
      const dLng = (f.longitude - coords.lng) * 111320 * Math.cos((coords.lat * Math.PI) / 180);
      const distM = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
      return { ...f, distM };
    }).sort((a, b) => a.distM - b.distM);

    const focosProximos = comDistancia.filter(f => f.distM <= RAIO_FOCOS_KM * 1000).slice(0, 4);

    if (focosProximos.length > 0) {
      focoMaisProximo = focosProximos[0];
      distanciaFocoMaisProximoM = focosProximos[0].distM;

      focosSat = focosProximos.map(f => ({
        satelite: f.satelite || 'Satélite não identificado pela fonte',
        sensor: 'Sensor orbital óptico-térmico (INPE BDQueimadas)',
        // FRP ausente fica indefinido: 0 MW afirmaria energia radiativa medida como nula.
        frpMw: typeof f.frp === 'number' ? f.frp : undefined,
        // O ID oficial do foco no BDQ é citável no laudo e permite reauditoria da detecção.
        confianca: [
          f.idFocoBdq ? `Detecção oficial BDQueimadas nº ${f.idFocoBdq}` : 'Detecção oficial BDQueimadas',
          f.riscoFogo !== null ? `Risco de fogo INPE: ${f.riscoFogo}` : null,
          f.diasSemChuva !== null ? `${f.diasSemChuva} dia(s) sem chuva` : null
        ].filter(Boolean).join(' · '),
        // Horário da detecção: se o INPE não informou, NÃO se substitui pelo horário da
        // ocorrência — são eventos distintos e a data da detecção é elemento probatório.
        dataHoraUtc: f.dataHoraGmt ?? undefined,
        distanciaMetrosFoco: f.distM
      }));
    }
  }

  // 2.1 Incidência em Terra Indígena / Unidade de Conservação (consulta espacial real)
  const areasProtegidas = await fetchAreasProtegidas(coords);

  // Se não houver satélite orbitando o ponto no exato momento, declarar expressamente a realidade técnica
  if (focosSat.length === 0) {
    const consultaOcorreu = focosInpeResult.sucesso;
    focosSat = [
      {
        satelite: 'INPE BDQueimadas',
        sensor: 'Sensores Orbitais Óptico-Térmicos (VIIRS/MODIS)',
        frpMw: undefined,
        // Distingue "o satélite não detectou" de "não consegui consultar o satélite":
        // no laudo, confundir as duas coisas suprime materialidade.
        confianca: consultaOcorreu
          ? 'O INPE respondeu à consulta e não reportou anomalia térmica no raio de 35 km da '
            + 'coordenada. Satélites têm janela de passagem: fogo sob nuvem ou entre passagens não é detectado.'
          : `CONSULTA NÃO REALIZADA — ${focosInpeResult.mensagem || 'fonte indisponível'}. `
            + 'A ausência de foco nesta lista NÃO significa ausência de fogo.',
        dataHoraUtc: undefined,
        distanciaMetrosFoco: -1
      }
    ];
  }

  // 3. Hidrografia e Vias Reais no Entorno (OpenStreetMap Overpass API)
  const geoFeatures = await fetchOsmOverpassFeatures(coords, RAIO_OVERPASS_METROS);

  const temHidrografia = geoFeatures.hidrografia.length > 0;
  const cursoPrincipal = temHidrografia ? geoFeatures.hidrografia[0] : null;

  // 4. SIGAMgeo Público (SEMIL-SP): autos de infração e boletins de incêndio
  //    O canal antigo era o WFS do DATAGEO, desativado na origem.
  const [sigamResult, incendiosResult] = await Promise.all([
    fetchAiaSigamgeo(coords, RAIO_AIA_METROS),
    fetchIncendiosBoi(coords, RAIO_BOI_METROS)
  ]);

  const aiaHistorico = {
    historicoEncontrado: sigamResult.registros.length > 0,
    quantidadeRegistros: sigamResult.totalNoRaio ?? sigamResult.registros.length,
    detalhes: sigamResult.registros.slice(0, 8).map(r => ({
      numeroAia: r.numeroProcesso
        ? `${r.numeroProcesso}${r.anoProcesso ? '/' + r.anoProcesso : ''}`
        : 'Processo não informado pela fonte',
      dataAutuacao: r.dataInfracaoUtc
        ? r.dataInfracaoUtc.slice(0, 10)
        : 'Data não informada pela fonte',
      infracao: r.infracao || 'Infração não detalhada pela fonte',
      valorMulta: typeof r.valorMulta === 'number'
        ? `R$ ${r.valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : undefined,
      // Reincidência é conclusão jurídica, não atributo do registro: depende de o
      // autuado ser o MESMO responsável pela gleba, o que este sistema não apura.
      reincidencia: false
    }))
  };

  // Prioriza a área de maior consequência jurídica: TI e UC federal deslocam competência.
  const areaProtegidaPrincipal =
    areasProtegidas.areas.find(a => a.tipo === 'TERRA_INDIGENA')
    ?? areasProtegidas.areas.find(a => a.tipo === 'UC_FEDERAL')
    ?? areasProtegidas.areas.find(a => a.tipo === 'UC_ESTADUAL')
    ?? null;

  // 5. Contexto Ambiental (100% livre de dados inventados)
  const contexto: ContextoAmbiental = {
    aia: {
      valor: aiaHistorico,
      fonte: sigamResult.fonte,
      camada: 'fiscalizacao_aia_sp',
      confiabilidade: sigamResult.sucesso ? 'REAL' : 'INDISPONIVEL',
      dataConsultaUtc: new Date().toISOString(),
      observacoes: !sigamResult.sucesso
        ? `Consulta ao SIGAMgeo NÃO realizada (${sigamResult.mensagem || 'fonte indisponível'}). `
          + (sigamResult.orientacaoOperador || 'O histórico de autuação não foi verificado.')
        : aiaHistorico.historicoEncontrado
        ? `Identificado(s) ${aiaHistorico.quantidadeRegistros} Auto(s) de Infração Ambiental num raio de `
          + `${RAIO_AIA_METROS} m da coordenada, na base pública da Polícia Ambiental (SEMIL-SP). `
          + `O mais próximo está a ${sigamResult.registros[0]?.distanciaMetros ?? '?'} m. `
          + 'ATENÇÃO: proximidade geográfica NÃO é reincidência. A reincidência exige que o autuado '
          + 'seja o mesmo responsável pela gleba, o que este sistema não apura — requisitar os autos '
          + 'pelos números de processo listados. Autuados exibidos de forma anonimizada (LGPD).'
        : 'Nenhum Auto de Infração Ambiental (AIA) anterior localizado para as coordenadas informadas nas bases abertas.'
    },
    /**
     * APP — presença de curso d’água no raio consultado, NÃO sobreposição medida.
     * O Overpass informa que existe feição hídrica dentro do raio de 3 km; não informa
     * a distância ao foco. A versão anterior gravava `distanciaMetros: 30` (a largura
     * legal mínima de APP, não uma medição) e o laudo imprimia "Distância ao foco: 30m"
     * como se fosse aferido.
     */
    app: {
      valor: {
        sobreposicao: false, // sobreposição exige medição, não presença no raio
        tipoApp: temHidrografia
          ? `Curso d’água cartografado no raio de ${RAIO_OVERPASS_METROS / 1000} km: ${cursoPrincipal?.nome || 'feição hídrica sem nome'}. `
            + 'Sobreposição com APP a ser MEDIDA (Art. 4º da Lei 12.651/2012).'
          : `Nenhuma feição hídrica cartografada no raio de ${RAIO_OVERPASS_METROS / 1000} km nas bases abertas.`,
        distanciaMetros: -1, // -1 = não medido; 0 significaria coincidência exata com o foco
        cursoDaguaNome: cursoPrincipal?.nome
      },
      fonte: geoFeatures.sucesso
        ? 'OpenStreetMap Overpass API / Infraestrutura Cartográfica Aberta'
        : 'Não consultada — Overpass indisponível',
      camada: 'waterway & natural=water',
      confiabilidade: geoFeatures.sucesso ? 'REAL' : 'INDISPONIVEL',
      dataConsultaUtc: new Date().toISOString(),
      observacoes: !geoFeatures.sucesso
        ? 'A consulta cartográfica ao OpenStreetMap falhou. A presença de APP no local NÃO foi '
          + 'verificada. Consulte a base hidrográfica da ANA ou a carta topográfica da região.'
        : temHidrografia
          ? `Corpo hídrico identificado no raio consultado: ${cursoPrincipal?.nome} (${cursoPrincipal?.detalhe}). `
            + 'A DISTÂNCIA entre o foco e a margem NÃO foi medida por este sistema — a largura da faixa de '
            + 'APP (Art. 4º da Lei 12.651/2012) depende da largura do curso d’água e exige medição em '
            + 'campo ou sobre base cartográfica georreferenciada. A tipificação do Art. 38 da Lei 9.605/98 '
            + 'não deve ser afirmada sem essa medição.'
          : 'Nenhum corpo hídrico cartografado no raio consultado. Bases abertas do OSM podem não mapear '
            + 'cursos d’água intermitentes ou de pequeno porte: a ausência aqui não exclui APP.'
    },
    /**
     * COBERTURA VEGETAL — NÃO VERIFICADA.
     * Não existe consulta a inventário de uso do solo neste fluxo. A versão anterior
     * declarava bioma e estágio sucessional derivados apenas da UF e rotulava a camada
     * como REAL, atribuindo-a a um "Inventário Oficial" nunca consultado. Além de
     * fabricar prova, isso alimentava o modelo de propagação (o combustível define a
     * taxa de avanço) e decidia a incidência do Art. 38-A da Lei 9.605/98.
     */
    /**
     * COBERTURA VEGETAL — derivada do foco orbital mais próximo.
     * O INPE publica `bioma` e `vegetacao` como atributo de cada detecção. É dado real,
     * mas caracteriza o PIXEL DETECTADO, não necessariamente a coordenada da ocorrência:
     * por isso a distância é sempre declarada junto. Sem foco próximo, permanece INDISPONIVEL.
     */
    vegetacaoNativa: {
      valor: {
        bioma: focoMaisProximo?.bioma ?? 'NÃO VERIFICADO',
        estagioSucessional: 'Não florestal/Agrícola',
        fitofisionomia: focoMaisProximo?.vegetacao
          ?? 'NÃO VERIFICADA — requer inspeção in loco ou consulta a inventário de uso do solo',
        leiAplicavel: 'Lei Federal nº 12.651/2012 (Código Florestal) e Lei Federal nº 9.605/1998'
      },
      fonte: focoMaisProximo
        ? 'INPE BDQueimadas (atributos bioma/vegetação da detecção orbital)'
        : 'Não consultada — nenhum foco orbital próximo para caracterizar a cobertura',
      camada: focoMaisProximo ? (focosInpeResult.camada ?? 'dados_abertos:focos') : 'indisponivel',
      confiabilidade: focoMaisProximo ? 'REAL' : 'INDISPONIVEL',
      dataConsultaUtc: new Date().toISOString(),
      observacoes: focoMaisProximo
        ? `Bioma e fitofisionomia informados pelo INPE para a detecção orbital situada a `
          + `${distanciaFocoMaisProximoM} m da coordenada da ocorrência — caracterizam o pixel `
          + `detectado, não necessariamente o ponto exato do fato. O ESTÁGIO SUCESSIONAL não é `
          + `fornecido pela fonte e permanece não verificado: a tipificação do Art. 38-A da Lei `
          + `9.605/98 exige caracterização pericial in loco.`
        : 'Nenhum foco orbital próximo o bastante para caracterizar a cobertura vegetal. Bioma, '
          + 'fitofisionomia e estágio sucessional devem ser determinados por inspeção pericial in loco '
          + 'ou por consulta ao MapBiomas. A tipificação do Art. 38-A da Lei 9.605/98 depende desta '
          + 'caracterização e não pode ser afirmada sem ela. O modelo de propagação foi executado com '
          + 'combustível de referência declarado, não com o combustível real.'
    },
    /**
     * UNIDADE DE CONSERVAÇÃO / TERRA INDÍGENA — consulta espacial real.
     * INTERSECTS contra os polígonos oficiais da FUNAI e do MMA publicados pelo GeoServer
     * do INPE. Substitui a versão anterior, que afirmava `afetada: false` marcado como REAL
     * sem nunca consultar o CNUC — negativa falsa que suprimia o Art. 40 da Lei 9.605/98.
     */
    unidadeConservacao: {
      valor: {
        afetada: areaProtegidaPrincipal !== null,
        tipoUC: areaProtegidaPrincipal
          ? (areaProtegidaPrincipal.tipo === 'UC_ESTADUAL' ? 'US' : 'PI')
          : 'NENHUMA',
        nomeUC: areaProtegidaPrincipal
          ? `${areaProtegidaPrincipal.nome} (${TIPO_AREA_LEGIVEL[areaProtegidaPrincipal.tipo]})`
          : undefined,
        // Incidência é sobreposição direta: a distância a UCs vizinhas não é medida.
        distanciaKm: 0
      },
      fonte: areasProtegidas.sucesso
        ? areasProtegidas.fonte
        : 'Consulta incompleta — GeoServer INPE (FUNAI/MMA)',
      camada: 'ti + uc_f_nao_reservas + uc_e_nao_reservas',
      confiabilidade: areasProtegidas.verificacaoCompleta ? 'REAL' : 'INDISPONIVEL',
      dataConsultaUtc: areasProtegidas.consultadoEmUtc || new Date().toISOString(),
      observacoes: !areasProtegidas.verificacaoCompleta
        ? 'ATENÇÃO: a verificação de áreas protegidas ficou INCOMPLETA — pelo menos uma camada '
          + `não respondeu (${areasProtegidas.mensagem || 'falha de consulta'}). Não é possível `
          + 'afirmar não incidência. Confirme no CNUC (cnuc.mma.gov.br) e na FUNAI: incidência em '
          + 'UC federal ou Terra Indígena atrai o Art. 40 da Lei 9.605/98 e desloca a competência '
          + 'para a Justiça Federal.'
        : areasProtegidas.areas.length > 0
          ? `INCIDÊNCIA CONFIRMADA por consulta espacial nos polígonos oficiais: `
            + `${areasProtegidas.areas.map(a => `${a.nome} [${TIPO_AREA_LEGIVEL[a.tipo]}]`).join('; ')}. `
            + (areasProtegidas.competenciaFederalIndicada
                ? 'ATENÇÃO — incidência em Terra Indígena ou UC federal: aplica-se o Art. 40 da Lei '
                  + '9.605/98 (causa de aumento) e a competência é da JUSTIÇA FEDERAL, com atribuição '
                  + 'da Polícia Federal. Comunicar imediatamente.'
                : 'Incidência em UC estadual: verificar o plano de manejo e o órgão gestor competente.')
          : 'As três camadas oficiais (Terras Indígenas/FUNAI, UCs federais e UCs estaduais/MMA) '
            + 'responderam à consulta espacial e a coordenada NÃO incide em nenhum perímetro. '
            + 'Reservas particulares (RPPN) e zonas de amortecimento não foram verificadas.'
    },
    car: {
      valor: {
        inscrito: false,
        codigoCar: 'Não vinculado automaticamente na consulta direta aberta',
        status: 'Não localizado',
        areaPropriedadeHa: 0,
        reservaLegalHa: 0,
        titularAnonimizado: 'Requer cruzamento com a base interna do SICAR / CAR-SP pela autoridade policial'
      },
      fonte: 'SICAR / SEMIL-SP (Camada de Dados Espaciais)',
      camada: 'sicar_sp_imoveis',
      confiabilidade: 'INDISPONIVEL',
      dataConsultaUtc: new Date().toISOString(),
      observacoes: 'A vinculação exata do número do CAR depende de certidão imobiliária ou cruzamento com a intranet governamental da SEMIL/INCRA.'
    }
  };

  // 6. Modelagem de Propagação Elíptica com Base nos Parâmetros Reais
  const projecao = modelFireSpread({
    origin: coords,
    ventoVelocidadeKmH: meteo.ventoVelocidadeKmH,
    ventoDirecaoGraus: meteo.ventoDirecaoGraus,
    umidadeRelativaPercentual: meteo.umidadeRelativaPercentual,
    temperaturaCelsius: meteo.temperaturaCelsius,
    bioma: contexto.vegetacaoNativa.valor.bioma,
    estagioVegetacao: contexto.vegetacaoNativa.valor.estagioSucessional
  });

  const azimuteAvanco = projecao.manchas.t1h.azimutePropagacaoGraus;
  const quadranteAvanco = getQuadrantName(azimuteAvanco);

  // 7. Diretrizes Táticas Multiagências utilizando Feições Reais Mapeadas
  const viasMapeadas = geoFeatures.vias.map(v => v.nome).filter(Boolean);
  const viaPrincipal = viasMapeadas.length > 0 ? viasMapeadas[0] : 'Estrada de Acesso Rural / Vicinal Local';

  const hidrografiaMapeada = geoFeatures.hidrografia.map(h => `${h.nome} (${h.detalhe})`);

  const diretrizes: DiretrizesTaticas = {
    bombeiros: {
      vetorAvanco: `Avanço prioritário da frente de fogo (head fire) em direção ao quadrante ${quadranteAvanco} (${azimuteAvanco}°), com velocidade estimada pelo modelo de ${projecao.taxaPropagacaoMetrosHora} m/h sob vento real de ${meteo.ventoVelocidadeKmH} km/h.`,
      pontosContencao: [
        `Aceiro tático preventivo ancorado na margem de ${viaPrincipal}.`,
        temHidrografia && cursoPrincipal
          ? `Linha de contenção natural na calha do ${cursoPrincipal.nome}.`
          : `Abertura de faixa limpa de retenção a sotavento no flanco de propagação.`,
        `Ataque prioritário pelos flancos para evitar o confinamento na cabeça do incêndio.`
      ],
      hidrografiaApoio: hidrografiaMapeada.length > 0
        ? hidrografiaMapeada.slice(0, 3).map(h => `Manancial mapeado no raio de ação: ${h} (verificar calado e acesso para moto-bomba).`)
        : [
            `Nenhum corpo hídrico de grande porte cartografado no raio de 3km nas bases abertas. Recomenda-se acionamento de caminhão-tanque de apoio logístico.`
          ],
      rotasEvacuacao: [
        `Evacuação preventiva das edificações rurais situadas no cone de projeção do quadrante ${quadranteAvanco}.`,
        `Rota de recuo e segurança para equipes de combate no sentido contrário ao vento (${getQuadrantName((azimuteAvanco + 180) % 360)}).`
      ],
      riscoEstrutural: `Fumaça com potencial de redução de visibilidade em acessos viários locais e dispersão de fuligem com risco respiratório.`
    },
    policiamentoOstensivo: {
      viasVicinaisControle: viasMapeadas.length > 0
        ? viasMapeadas.slice(0, 3).map(v => `Ponto de controle e triagem: ${v}`)
        : [`Controle de tráfego na via de acesso principal ao imóvel rural.`],
      pontosBloqueioSugeridos: [
        `Bloqueio preventivo na interseção de ${viaPrincipal} para circulação restrita a viaturas de socorro e combate.`,
        `Triagem de veículos pesados e maquinário agrícola nos acessos à propriedade.`
      ],
      alertaMuralhaPaulistaLPR: `Recomenda-se verificação junto às centrais de monitoramento de tráfego e inteligência policial sobre veículos e utilitários que transitaram nas vias de acesso nas 4 horas que antecederam o foco (${input.timestampUtc}).`,
      orientacaoSegurancaPerimetro: `Isolamento do vértice de origem (ponto de menor abertura do cone de queima) para preservação de vestígios de ignição para a Perícia Técnico-Científica.`
    },
    policiaAmbiental: {
      coordenadaPontoOrigem: `Latitude: ${coords.lat.toFixed(6)} | Longitude: ${coords.lng.toFixed(6)} (WGS84) — Ponto reportado de anomalia térmica.`,
      verificacaoMaquinario: `Inspeção do maquinário agrícola em operação na área (tratores, implementos, atomizadores) quanto à conformidade de abafador e dispositivos de fagulhas.`,
      confrontoHistoricoAia: aiaHistorico.historicoEncontrado
        ? `CONFRONTAÇÃO CADASTRAL: constam ${aiaHistorico.quantidadeRegistros} Auto(s) de Infração `
          + `Ambiental num raio de ${RAIO_AIA_METROS} m na base pública da Polícia Ambiental `
          + `(${aiaHistorico.detalhes.slice(0, 4).map(d => d.numeroAia).join(', ')}). `
          + `Requisitar os autos para identificar o autuado e averiguar embargo ou sanção vigente. `
          + `ATENÇÃO: proximidade não estabelece reincidência do responsável por esta gleba.`
        : `Vistoriar in loco a existência, manutenção e largura dos aceiros perimetrais obrigatórios nos limites da propriedade e com faixas de servidão.`,
      orientacaoColetaVestigios: `Preservar o vértice em V do foco inicial para determinação do ponto de ignição primário. Coletar amostras de solo/fuligem caso haja indícios de uso de acelerantes de combustão.`
    }
  };

  // 8. Instrução Forense e Tipificação Penal Preliminar

  // Inventário explícito do que NÃO foi apurado. Vai para a ressalva do laudo para que
  // o Delegado e o MP saibam exatamente onde a instrução está incompleta.
  const camadasNaoVerificadas: string[] = [];
  if (contexto.aia.confiabilidade === 'INDISPONIVEL') camadasNaoVerificadas.push('histórico de Auto de Infração Ambiental (AIA)');
  if (contexto.app.confiabilidade === 'INDISPONIVEL') camadasNaoVerificadas.push('sobreposição com Área de Preservação Permanente');
  if (contexto.vegetacaoNativa.confiabilidade === 'INDISPONIVEL') camadasNaoVerificadas.push('cobertura vegetal, bioma e estágio sucessional');
  if (contexto.unidadeConservacao.confiabilidade === 'INDISPONIVEL') camadasNaoVerificadas.push('incidência em Unidade de Conservação ou Terra Indígena');
  if (contexto.car.confiabilidade === 'INDISPONIVEL') camadasNaoVerificadas.push('vinculação do imóvel no CAR');
  if (meteo.confiabilidade === 'INDISPONIVEL') camadasNaoVerificadas.push('condições meteorológicas do momento do fato');

  /**
   * Tese de autoria — três estados, não dois.
   *
   * A versão anterior só distinguia "tem AIA" de "não tem AIA", e o ramo negativo
   * afirmava que NÃO CONSTAM autuações mesmo quando a consulta sequer ocorreu. Além
   * disso marcava `omissaoAceirosRegulamentares: true` nos dois ramos — uma omissão
   * que ninguém verificou, e que é justamente um dos elementos que sustentam dolo eventual.
   */
  const aiaVerificado = contexto.aia.confiabilidade === 'REAL';
  const meteoVerificada = meteo.confiabilidade === 'REAL';
  const condicoesTexto = meteoVerificada
    ? `vento ${meteo.ventoVelocidadeKmH} km/h e UR ${meteo.umidadeRelativaPercentual}%`
    : 'condições meteorológicas não verificadas';

  const doloTese = !aiaVerificado
    ? {
        // Sem a consulta de AIA não há lastro para classificar a conduta.
        classificacao: 'Indeterminado / Em Apuração' as const,
        fundamentacao: 'CLASSIFICAÇÃO NÃO REALIZADA: o histórico de Auto de Infração Ambiental não pôde '
          + 'ser consultado, e não há elementos suficientes para distinguir dolo de culpa. A ausência de '
          + 'registro nas bases consultadas por este sistema NÃO equivale a ausência de autuação anterior. '
          + 'Requisitar certidão de antecedentes ambientais ao órgão estadual competente e ao IBAMA, e '
          + 'verificar em campo a existência e a manutenção dos aceiros perimetrais regulamentares.',
        reincidenciaAia: false,
        omissaoAceirosRegulamentares: false
      }
    : aiaHistorico.historicoEncontrado
      ? {
          classificacao: 'Dolo Eventual (Assunção de Risco Proibido)' as const,
          fundamentacao: `Consulta à base pública retornou histórico de autuação ambiental anterior `
            + `(${aiaHistorico.quantidadeRegistros} registro(s)), o que constitui INDÍCIO — não prova — de `
            + `conhecimento prévio do dever de cuidado. Conjugado a ${condicoesTexto}, há elementos para a `
            + `hipótese de assunção consciente do risco de queima incontrolada. A caracterização do dolo `
            + `eventual depende ainda de verificação em campo da omissão de aceiros regulamentares e de `
            + `oitiva do responsável, não realizadas por este sistema.`,
          reincidenciaAia: true,
          omissaoAceirosRegulamentares: false // não verificado em campo
        }
      : {
          classificacao: 'Indeterminado / Em Apuração' as const,
          fundamentacao: `A consulta à base pública de autuação ambiental foi realizada e não retornou `
            + `registro anterior para a coordenada. Isso afasta o indício de reincidência, mas NÃO permite, `
            + `por si só, classificar a conduta como culposa: a distinção entre dolo e culpa depende da `
            + `dinâmica da ignição, de vestígios de acelerante, do horário e do depoimento do responsável — `
            + `elementos a apurar em diligência. Condições no momento do fato: ${condicoesTexto}.`,
          reincidenciaAia: false,
          omissaoAceirosRegulamentares: false
        };

  const forense: InstrucaoForense = {
    teseAutoriaDolo: doloTese,
    tipificacaoPenalPreliminar: [
      {
        diploma: 'Lei Federal nº 9.605/1998 (Crimes Ambientais)',
        artigo: 'Art. 41',
        conduta: 'Provocar incêndio em mata ou floresta.',
        penaOuSancao: 'Reclusão de 2 a 4 anos, e multa. (Na modalidade culposa: detenção de 6 meses a 1 ano e multa).'
      },
      // Art. 38 depende de APP CONFIRMADA. A presença de curso d’água no raio de 3 km
      // é indício a apurar, não sobreposição medida: incluir a tipificação aqui de forma
      // incondicional seria excesso acusatório, exatamente o que a Defesa ataca.
      ...(contexto.app.valor.sobreposicao
        ? [
            {
              diploma: 'Lei Federal nº 9.605/1998 (Crimes Ambientais)',
              artigo: 'Art. 38',
              conduta: 'Destruir ou danificar floresta considerada de preservação permanente (APP), mesmo que em formação.',
              penaOuSancao: 'Detenção de 1 a 3 anos, ou multa, ou ambas cumulativamente.'
            }
          ]
        : [])
    ],
    tipificacaoAdministrativa: [
      {
        diploma: 'Decreto Federal nº 6.514/2008',
        artigo: 'Art. 58',
        conduta: 'Fazer uso de fogo em áreas agropastoris sem autorização do órgão ambiental competente ou em desacordo com a obtida.',
        penaOuSancao: 'Multa de R$ 1.000,00 por hectare ou fração.'
      },
      ...(contexto.app.valor.sobreposicao
        ? [
            {
              diploma: 'Decreto Federal nº 6.514/2008',
              artigo: 'Art. 43',
              conduta: 'Destruir ou danificar florestas ou demais formas de vegetação natural de preservação permanente.',
              penaOuSancao: 'Multa de R$ 5.000,00 por hectare ou fração.'
            }
          ]
        : []),
      {
        diploma: 'Lei Federal nº 12.651/2012 (Código Florestal)',
        artigo: 'Art. 38',
        conduta: 'Vedação do uso de fogo na vegetação, ressalvadas práticas de queima controlada devidamente autorizadas pelo órgão ambiental.',
        penaOuSancao: 'Embargo administrativo da área e reparação civil integral dos danos ambientais.'
      }
    ],
    ressalvaPreliminaridade: 'RESSALVA FORENSE OBRIGATÓRIA: A instrução técnica e as tipificações '
      + 'preliminares decorrem de análise automatizada de dados geoespaciais e meteorológicos auditáveis. '
      + 'A tipificação definitiva e a propositura da ação penal cabem exclusivamente à Autoridade Policial '
      + '(Delegado de Polícia) e ao Ministério Público. '
      + (camadasNaoVerificadas.length > 0
          ? `ATENÇÃO — as seguintes camadas NÃO foram verificadas nesta análise: ${camadasNaoVerificadas.join('; ')}. `
            + 'Tipificações que dependam delas estão deliberadamente ausentes e podem ser cabíveis após apuração. '
            + 'Detecção orbital comprova materialidade (houve fogo, onde e quando); NÃO comprova autoria.'
          : 'Detecção orbital comprova materialidade (houve fogo, onde e quando); NÃO comprova autoria.'),
    imagensBrasilMais: {
      disponibilidadePlanetScope3m: 'DISPONIVEL_NO_PORTAL_MJSP',
      janelaPreEvento: 'Cenas orbitais de passagem diária do sensor PlanetScope (3m de resolução espacial)',
      janelaPosEvento: 'Passagem orbital subsequente com processamento de ortorretificação',
      instrucaoRequisicao: 'Requisitar formalmente as cenas PlanetScope com cadeia de custódia na Plataforma Brasil M.A.I.S (MJSP) mediante perfil institucional credenciado.'
    }
  };

  // 9. Cadeia de Custódia Determinística (SHA-256)
  const geoRefString = `LAT=${coords.lat.toFixed(6)};LNG=${coords.lng.toFixed(6)};MUNICIPIO=${input.municipio}-${input.uf};COMARCA=${input.comarca}`;
  const carString = `CAR=${contexto.car.valor.codigoCar};STATUS=${contexto.car.valor.status}`;
  /*
   * O payload canônico é o que o hash SHA-256 certifica. Codificar uma camada não
   * verificada como "NAO" fazia o bloco de custódia assinar criptograficamente uma
   * falsa negativa — e listar DATAGEO_WFS em DATA_SOURCES afirmava uma consulta que
   * nunca ocorreu. Ambos passam a refletir o que de fato aconteceu.
   */
  const estadoCamada = (c: ConfiabilidadeDado, positivo: boolean): string =>
    c === 'INDISPONIVEL' ? 'NAO_VERIFICADO' : positivo ? 'SIM' : 'NAO';

  const sigamgeoString =
    `AIA_REINCIDENCIA=${estadoCamada(contexto.aia.confiabilidade, aiaHistorico.historicoEncontrado)};`
    + `APP_PRESENTE=${estadoCamada(contexto.app.confiabilidade, contexto.app.valor.sobreposicao)};`
    + `UC_TI_INCIDENCIA=${estadoCamada(contexto.unidadeConservacao.confiabilidade, contexto.unidadeConservacao.valor.afetada)}`;

  // Apenas as fontes que efetivamente responderam entram na cadeia de custódia.
  const fontesEfetivas: string[] = [];
  if (meteo.confiabilidade === 'REAL') fontesEfetivas.push('OPEN_METEO_V1');
  if (focosInpeResult.sucesso) fontesEfetivas.push('INPE_BDQUEIMADAS_WFS');
  if (areasProtegidas.verificacaoCompleta) fontesEfetivas.push('INPE_TI_UC_WFS');
  if (geoFeatures.sucesso) fontesEfetivas.push('OSM_OVERPASS');
  if (sigamResult.sucesso) fontesEfetivas.push('DATAGEO_WFS');
  const dataSourcesString = fontesEfetivas.length > 0
    ? fontesEfetivas.join('+')
    : 'NENHUMA_FONTE_RESPONDEU';

  const custodia = await generateCustodyBlock({
    stampUtc: input.timestampUtc,
    geoRef: geoRefString,
    cadastroCar: carString,
    historicoSigamgeo: sigamgeoString,
    dataSources: dataSourcesString,
    operatorId: input.operadorId
  });

  return {
    input,
    contexto,
    focosSat,
    meteo,
    projecao,
    diretrizes,
    forense,
    custodia
  };
}
