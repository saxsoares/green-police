/**
 * Cálculos Geoespaciais, Conversão de CRS e Modelagem de Propagação Elíptica
 * (Modelo Rothermel / Alexander para projeção de manchas 1h, 3h e 6h)
 */

import { CoordenadaGeo, CoordenadaUTM, ManchaElipse, NivelRisco, ProjecaoPropagacao } from '../types';

/**
 * Converte latitude e longitude decimal (WGS84 / EPSG:4326) para UTM (SIRGAS 2000)
 * Adequado para o Brasil (Fusos 22 e 23 no Estado de São Paulo)
 */
export function latLngToUtm(lat: number, lng: number): CoordenadaUTM {
  // Constantes elipsoide WGS84 / SIRGAS 2000
  const a = 6378137.0; // semi-eixo maior
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const ePrime2 = e2 / (1 - e2);

  const zone = Math.floor((lng + 180) / 6) + 1;
  const lambda0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180); // meridiano central

  const phi = lat * (Math.PI / 180);
  const lambda = lng * (Math.PI / 180);

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = ePrime2 * cosPhi * cosPhi;
  const A = cosPhi * (lambda - lambda0);

  const M = a * (
    (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi -
    (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi) +
    (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi) -
    (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi)
  );

  const k0 = 0.9996;

  const easting = k0 * N * (
    A + (1 - T + C) * Math.pow(A, 3) / 6 +
    (5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * Math.pow(A, 5) / 120
  ) + 500000;

  let northing = k0 * (
    M + N * tanPhi * (
      A * A / 2 +
      (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 +
      (61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * Math.pow(A, 6) / 720
    )
  );

  if (lat < 0) {
    northing += 10000000; // Hemisfério Sul
  }

  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
    zone,
    hemisphere: lat < 0 ? 'S' : 'N'
  };
}

/**
 * Converte UTM (SIRGAS 2000) de volta para Lat/Lng WGS84
 */
export function utmToLatLng(utm: CoordenadaUTM): CoordenadaGeo {
  const k0 = 0.9996;
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const ePrime2 = e2 / (1 - e2);

  const x = utm.easting - 500000;
  let y = utm.northing;
  if (utm.hemisphere === 'S') {
    y -= 10000000;
  }

  const lambda0 = ((utm.zone - 1) * 6 - 180 + 3) * (Math.PI / 180);

  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const phi1 = mu +
    (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) +
    (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
    (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const T1 = tanPhi1 * tanPhi1;
  const C1 = ePrime2 * cosPhi1 * cosPhi1;
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
  const D = x / (N1 * k0);

  const latRad = phi1 - (N1 * tanPhi1 / R1) * (
    D * D / 2 -
    (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ePrime2) * Math.pow(D, 4) / 24 +
    (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ePrime2 - 3 * C1 * C1) * Math.pow(D, 6) / 720
  );

  const lngRad = lambda0 + (
    D -
    (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 +
    (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ePrime2 + 24 * T1 * T1) * Math.pow(D, 5) / 120
  ) / cosPhi1;

  return {
    lat: Number((latRad * (180 / Math.PI)).toFixed(6)),
    lng: Number((lngRad * (180 / Math.PI)).toFixed(6))
  };
}

/**
 * Projeta uma nova coordenada a partir de um ponto de origem, distância (metros) e azimute (graus)
 */
export function projectCoordinates(
  origin: CoordenadaGeo,
  distanceMeters: number,
  bearingDegrees: number
): CoordenadaGeo {
  const R = 6378137; // Raio da Terra em metros
  const d = distanceMeters / R;
  const brng = bearingDegrees * (Math.PI / 180);
  const lat1 = origin.lat * (Math.PI / 180);
  const lon1 = origin.lng * (Math.PI / 180);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: Number((lat2 * (180 / Math.PI)).toFixed(6)),
    lng: Number((lon2 * (180 / Math.PI)).toFixed(6))
  };
}

/**
 * Gera os pontos da elipse de fogo no plano geográfico
 * @param origin Ponto de ignição inicial (foco de calor)
 * @param forwardDistanceMeters Distância de avanço na frente de fogo (head fire)
 * @param backDistanceMeters Distância de queima lenta contra o vento (backing fire)
 * @param flankHalfWidthMeters Meia largura lateral da elipse (flank fire)
 * @param propagationAzimuthGraus Azimute para onde o fogo corre (direção do vento + 180°)
 */
export function generateFireEllipsePolygon(
  origin: CoordenadaGeo,
  forwardDistanceMeters: number,
  backDistanceMeters: number,
  flankHalfWidthMeters: number,
  propagationAzimuthGraus: number,
  numPoints: number = 36
): CoordenadaGeo[] {
  const points: CoordenadaGeo[] = [];
  const rad = propagationAzimuthGraus * (Math.PI / 180);

  // O centro geométrico da elipse fica deslocado da ignição para a frente
  const semiMajorA = (forwardDistanceMeters + backDistanceMeters) / 2;
  const semiMinorB = flankHalfWidthMeters;
  const centerShiftMeters = (forwardDistanceMeters - backDistanceMeters) / 2;

  // Centro da elipse
  const center = projectCoordinates(origin, centerShiftMeters, propagationAzimuthGraus);

  for (let i = 0; i < numPoints; i++) {
    const theta = (i * 2 * Math.PI) / numPoints;
    // Ponto na elipse canônica
    const x = semiMinorB * Math.cos(theta);
    const y = semiMajorA * Math.sin(theta);

    // Rotação segundo o azimute de propagação
    const rotX = x * Math.cos(rad) - y * Math.sin(rad);
    const rotY = x * Math.sin(rad) + y * Math.cos(rad);

    const dist = Math.sqrt(rotX * rotX + rotY * rotY);
    const pointAngle = (Math.atan2(rotX, rotY) * (180 / Math.PI) + 360) % 360;

    points.push(projectCoordinates(center, dist, pointAngle));
  }

  // Fechar o polígono
  if (points.length > 0) {
    points.push(points[0]);
  }

  return points;
}

/**
 * Executa a modelagem de propagação elíptica (Rothermel / Alexander)
 */
export function modelFireSpread(params: {
  origin: CoordenadaGeo;
  ventoVelocidadeKmH: number;
  ventoDirecaoGraus: number; // Azimute de onde o vento sopra (ex: 315° = NW)
  umidadeRelativaPercentual: number;
  temperaturaCelsius: number;
  bioma: string;
  estagioVegetacao: string;
}): ProjecaoPropagacao {
  const {
    origin,
    ventoVelocidadeKmH,
    ventoDirecaoGraus,
    umidadeRelativaPercentual,
    temperaturaCelsius,
    bioma,
    estagioVegetacao
  } = params;

  // Direção para onde o fogo corre (a favor do vento)
  const propagationAzimuth = (ventoDirecaoGraus + 180) % 360;

  // A cobertura vegetal pode não ter sido verificada (não há integração com inventário
  // de uso do solo). Nesse caso o modelo roda com combustível de referência e a
  // ressalvaForense declara isso expressamente.
  const combustivelVerificado =
    Boolean(bioma) &&
    !bioma.includes('NÃO VERIFICADO') &&
    !estagioVegetacao.includes('NÃO VERIFICAD');

  // Taxa base de espalhamento (ROS - Rate of Spread) em m/h baseada no combustível
  // Coeficientes de referência: Rothermel (1972) e prática operacional de CBM para
  // vegetação campestre/agropastoril brasileira.
  let baseRosMh = 120; // 120 metros por hora para pastagem/vegetação média
  if (estagioVegetacao === 'Avançado' || estagioVegetacao === 'Primário') {
    baseRosMh = 85; // mata mais densa retarda avanço rasteiro se não for copa
  } else if (bioma.includes('Cerrado') || estagioVegetacao.includes('Pioneiro')) {
    baseRosMh = 180; // cerrado e gramíneas secas propagam muito velozmente
  }

  // Fator multiplicador de vento: modelo empírico de Rothermel
  const windFactor = Math.pow(1 + Math.max(0, ventoVelocidadeKmH) * 0.12, 1.25);

  // Fator multiplicador de umidade: quanto mais seco, exponencialmente mais rápido
  let humidityFactor = 1.0;
  if (umidadeRelativaPercentual < 15) {
    humidityFactor = 2.4;
  } else if (umidadeRelativaPercentual < 25) {
    humidityFactor = 1.8;
  } else if (umidadeRelativaPercentual < 35) {
    humidityFactor = 1.4;
  } else if (umidadeRelativaPercentual > 60) {
    humidityFactor = 0.65;
  }

  // Fator de temperatura
  const tempFactor = temperaturaCelsius > 32 ? 1.25 : 1.0;

  // Taxa de propagação da frente (head fire) em m/h
  const headRateMetersHour = Math.round(baseRosMh * windFactor * humidityFactor * tempFactor);

  // Razão comprimento / largura (Alexander 1985 para elipses de fogo):
  // L/W = 1 + 0.25 * (vento em km/h)^0.8
  const lengthWidthRatio = Math.max(1.15, 1.0 + 0.22 * Math.pow(Math.max(1, ventoVelocidadeKmH), 0.78));

  // Função para calcular mancha por tempo
  const calculateMancha = (horas: 1 | 3 | 6): ManchaElipse => {
    // Distância de avanço na frente
    const forwardDistance = headRateMetersHour * horas;
    // Distância de queima para trás (backing fire) é tipicamente 10% a 15% da frente
    const backDistance = Math.round(forwardDistance * (0.10 + 0.05 / lengthWidthRatio));
    // Comprimento total do eixo maior (2a)
    const majorAxis = forwardDistance + backDistance;
    // Largura do eixo menor (2b)
    const minorAxis = Math.round(majorAxis / lengthWidthRatio);
    const flankHalfWidth = minorAxis / 2;

    // Área da elipse = pi * a * b
    const areaM2 = Math.PI * (majorAxis / 2) * flankHalfWidth;
    const areaHa = Number((areaM2 / 10000).toFixed(2));

    // Perímetro aproximado de Ramanujan para elipse
    const a = majorAxis / 2;
    const b = flankHalfWidth;
    const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    const perimMeters = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    const perimKm = Number((perimMeters / 1000).toFixed(2));

    const polygon = generateFireEllipsePolygon(
      origin,
      forwardDistance,
      backDistance,
      flankHalfWidth,
      propagationAzimuth
    );

    return {
      tempoHoras: horas,
      areaHectares: areaHa,
      perimetroKm: perimKm,
      eixoMaiorMetros: Math.round(majorAxis),
      eixoMenorMetros: Math.round(minorAxis),
      azimutePropagacaoGraus: Math.round(propagationAzimuth),
      coordenadasPoligono: polygon
    };
  };

  const t1h = calculateMancha(1);
  const t3h = calculateMancha(3);
  const t6h = calculateMancha(6);

  // Classificação de risco operacional
  let nivelRisco: NivelRisco = 'MEDIO';
  if (t3h.areaHectares > 120 || umidadeRelativaPercentual < 20 || ventoVelocidadeKmH > 35) {
    nivelRisco = 'CRITICO';
  } else if (t3h.areaHectares > 45 || umidadeRelativaPercentual < 30 || ventoVelocidadeKmH > 22) {
    nivelRisco = 'ALTO';
  } else if (t3h.areaHectares < 15 && umidadeRelativaPercentual > 50 && ventoVelocidadeKmH < 12) {
    nivelRisco = 'BAIXO';
  }

  // Intensidade estimada da linha de fogo de Byram: I = H * w * r
  // Aproximado em kW/m
  const intensidadeEstimadaKwM = Math.round(headRateMetersHour * 2.8);

  const alvosCriticosNoRaio: string[] = [
    `APP de Cursos Hídricos no quadrante ${getQuadrantName(propagationAzimuth)} (distância de avanço ~${t3h.eixoMaiorMetros}m)`,
    `Malha viária vicinal e linhas rurais de eletrificação a sotavento`,
    `Remanescente de Vegetação Nativa classificado como Estágio ${estagioVegetacao}`
  ];

  return {
    modeloBase: 'Rothermel (1972) / Alexander (1985) — Modelo Elíptico de Propagação Livre',
    nivelRisco,
    taxaPropagacaoMetrosHora: headRateMetersHour,
    intensidadeEstimadaKwM,
    manchas: {
      t1h,
      t3h,
      t6h
    },
    alvosCriticosNoRaio,
    ressalvaForense: 'PROJEÇÃO MATEMÁTICA — NÃO É MEDIÇÃO. Modelo empírico de Rothermel (taxa de '
      + 'propagação) e Alexander 1985 (razão dos eixos da elipse), destinado ao balizamento de resposta '
      + 'tática emergencial. '
      + (combustivelVerificado
          ? ''
          : 'A cobertura vegetal NÃO foi verificada: o modelo foi executado com combustível de '
            + 'referência (pastagem/vegetação média, 120 m/h de base) e a taxa real pode divergir '
            + 'substancialmente. ')
      + 'O modelo desconsidera declividade do terreno, heterogeneidade do combustível, barreiras '
      + 'naturais, mudança de vento e ação de supressão. Não substitui o laudo pericial in loco de '
      + 'dinâmica de incêndio, e as áreas projetadas não devem ser citadas como área queimada apurada.'
  };
}

/**
 * Exporta as manchas como FeatureCollection GeoJSON válida
 */
export function exportManchasGeoJson(
  projecao: ProjecaoPropagacao,
  origem: CoordenadaGeo,
  idOcorrencia: string
): string {
  const features = [
    // Ponto de ignição
    {
      type: 'Feature',
      properties: {
        tipo: 'PONTO_IGNICAO_FOCO',
        idOcorrencia,
        lat: origem.lat,
        lng: origem.lng
      },
      geometry: {
        type: 'Point',
        coordinates: [origem.lng, origem.lat]
      }
    },
    // Mancha 1h
    {
      type: 'Feature',
      properties: {
        tipo: 'PROJECAO_1H',
        tempoHoras: 1,
        areaHectares: projecao.manchas.t1h.areaHectares,
        perimetroKm: projecao.manchas.t1h.perimetroKm,
        eixoMaiorM: projecao.manchas.t1h.eixoMaiorMetros,
        azimutePropagacao: projecao.manchas.t1h.azimutePropagacaoGraus
      },
      geometry: {
        type: 'Polygon',
        coordinates: [projecao.manchas.t1h.coordenadasPoligono.map(p => [p.lng, p.lat])]
      }
    },
    // Mancha 3h
    {
      type: 'Feature',
      properties: {
        tipo: 'PROJECAO_3H',
        tempoHoras: 3,
        areaHectares: projecao.manchas.t3h.areaHectares,
        perimetroKm: projecao.manchas.t3h.perimetroKm,
        eixoMaiorM: projecao.manchas.t3h.eixoMaiorMetros,
        azimutePropagacao: projecao.manchas.t3h.azimutePropagacaoGraus
      },
      geometry: {
        type: 'Polygon',
        coordinates: [projecao.manchas.t3h.coordenadasPoligono.map(p => [p.lng, p.lat])]
      }
    },
    // Mancha 6h
    {
      type: 'Feature',
      properties: {
        tipo: 'PROJECAO_6H',
        tempoHoras: 6,
        areaHectares: projecao.manchas.t6h.areaHectares,
        perimetroKm: projecao.manchas.t6h.perimetroKm,
        eixoMaiorM: projecao.manchas.t6h.eixoMaiorMetros,
        azimutePropagacao: projecao.manchas.t6h.azimutePropagacaoGraus
      },
      geometry: {
        type: 'Polygon',
        coordinates: [projecao.manchas.t6h.coordenadasPoligono.map(p => [p.lng, p.lat])]
      }
    }
  ];

  return JSON.stringify({
    type: 'FeatureCollection',
    metadata: {
      sistema: 'SIMIA-Verde (SENASP)',
      idOcorrencia,
      modelo: projecao.modeloBase,
      geradoEmUtc: new Date().toISOString()
    },
    features
  }, null, 2);
}

export function getQuadrantName(degrees: number): string {
  const val = Math.floor((degrees / 45) + 0.5);
  const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return arr[(val % 8)];
}
