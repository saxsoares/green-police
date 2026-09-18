// Carrega o .env da raiz antes de qualquer leitura de process.env.
// Sem isto, o arquivo .env era ignorado fora do Docker (em Docker as variáveis
// chegam pelo compose), e a NASA_FIRMS_MAP_KEY nunca era encontrada localmente.
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { consultarAreasProtegidas, consultarFocos, isoDeAquisicaoFirms } from './server/inpeWfs';
import { consultarAia, consultarBoiIncendio, dentroDeSaoPaulo } from './server/sigamgeo';
import {
  consultarFonte,
  gravarCacheFonte,
  lerCacheFonte,
  deltaGraus,
  mascararSegredos,
  registrarFalhaFonte,
  respostaIndisponivel
} from './server/proxyFetch';
import {
  diagnosticarBanco,
  inicializarBanco,
  listarEventosCustodia,
  listarOcorrencias,
  obterOcorrencia,
  registrarEventoCustodia,
  removerOcorrencia,
  salvarOcorrencia
} from './server/db';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Dossiês periciais completos são payloads grandes (polígonos de propagação, detecções orbitais).
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// ROTAS DE API: Integrações Reais e Proxy para Evitar Bloqueio de CORS
// -------------------------------------------------------------

// Tabela de Códigos de Estado do IBGE para o INPE BDQueimadas
const UF_IBGE_MAP: Record<string, number> = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17,
  MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27, SE: 28, BA: 29,
  MG: 31, ES: 32, RJ: 33, SP: 35,
  PR: 41, SC: 42, RS: 43,
  MS: 50, MT: 51, GO: 52, DF: 53
};

// Status dos Conectores Orbitais (NASA FIRMS vs INPE BDQueimadas)
app.get('/api/satellites/status', async (req, res) => {
  const envKey = process.env.NASA_FIRMS_MAP_KEY?.trim();
  const headerKey = (req.get('x-nasa-map-key') || '').trim();
  const queryKey = (req.query.mapKey as string)?.trim();
  const activeKey = headerKey || queryKey || envKey;
  const hasKey = Boolean(activeKey && activeKey.length > 5);
  const maskedKey = hasKey ? `${activeKey!.slice(0, 4)}****************${activeKey!.slice(-4)}` : null;

  let nasaLiveTelemetry: any = null;
  if (hasKey) {
    // A verificação de telemetria TAMBÉM consome uma transação da cota, e esta rota é
    // chamada toda vez que a aba de satélites é aberta. Cache de 5 minutos: o saldo de
    // cota não muda de forma relevante nesse intervalo.
    const chaveTelemetria = `nasa:mapkey_status:${activeKey!.slice(-6)}`;
    const telemetriaCache = lerCacheFonte(chaveTelemetria);

    if (telemetriaCache) {
      nasaLiveTelemetry = telemetriaCache.payload;
    } else {
      const r = await consultarFonte<string>({
        url: `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${activeKey}`,
        fonte: 'NASA FIRMS (mapkey_status)',
        formato: 'texto',
        timeoutMs: 6000
      });
      if (r.sucesso) {
        try {
          nasaLiveTelemetry = JSON.parse(r.dados);
          gravarCacheFonte(chaveTelemetria, nasaLiveTelemetry, 5 * 60 * 1000);
        } catch {
          // A NASA às vezes responde texto puro nesta rota de telemetria.
        }
      } else {
        registrarFalhaFonte('/api/satellites/status', r.erro);
      }
    }
  }

  return res.json({
    nasa: {
      hasKey,
      maskedKey,
      status: hasKey
        ? nasaLiveTelemetry
          ? `Chave Ativa e Verificada na NASA (${nasaLiveTelemetry.current_transactions ?? '?'}/${nasaLiveTelemetry.transaction_limit ?? '?'} transações)`
          : 'Chave Configurada no Ambiente'
        : 'Chave não detectada no .env',
      provider: 'NASA LANCE / EOSDIS (FIRMS)',
      telemetria: nasaLiveTelemetry,
      sensores: ['VIIRS 375m (NOAA-20)', 'VIIRS 375m (NOAA-21)', 'VIIRS 375m (Suomi-NPP)', 'MODIS 1km (Terra/Aqua)'],
      requerChave: true
    },
    inpe: {
      hasKey: true,
      requerChave: false,
      status: 'API 100% Pública e Aberta (Sem necessidade de chave)',
      provider: 'INPE / MCTI (Governo do Brasil)',
      satelites: ['AQUA (Referência)', 'TERRA', 'NOAA-20', 'METOP-B', 'GOES-16'],
      descricaoAutenticacao: 'O INPE BDQueimadas é um bem público de dados abertos. Nenhum token ou cadastro de API é exigido.'
    }
  });
});

// 1. Meteorologia Real via Open-Meteo
app.get('/api/meteo', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias' });
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure`;

    const r = await consultarFonte<any>({
      url,
      fonte: 'Open-Meteo API v1',
      validar: d => d && typeof d.current === 'object' && d.current !== null
    });

    if (!r.sucesso) {
      registrarFalhaFonte('/api/meteo', r.erro);
      return res.status(502).json(respostaIndisponivel({
        fonte: r.fonte,
        erro: r.erro,
        motivo: r.motivo,
        consultadoEmUtc: r.consultadoEmUtc,
        orientacaoOperador: 'Meteorologia não verificada para esta coordenada. Afira vento, umidade e '
          + 'temperatura em estação de referência (INMET/CPTEC) e informe os valores manualmente na '
          + 'reanálise pericial antes de concluir o laudo.'
      }));
    }

    return res.json({ sucesso: true, ...r.dados, fonte: r.fonte, consultadoEmUtc: r.consultadoEmUtc });
  } catch (err: any) {
    registrarFalhaFonte('/api/meteo', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message), fonte: 'Open-Meteo API v1' });
  }
});

// 2. Focos de Calor — INPE BDQueimadas via GeoServer OGC (TerraBrasilis)
//
// A API REST antiga (queimadas.dgi.inpe.br/api/focos) foi desativada pelo INPE e passou
// a responder 404. O canal atual é o GeoServer do Programa Queimadas, que além de voltar
// a funcionar entrega mais do que a API antiga: FRP, bioma, vegetação, risco de fogo,
// dias sem chuva e séries históricas por ano.
app.get('/api/focos-inpe', async (req, res) => {
  try {
    const uf = ((req.query.estado as string) || '').toUpperCase().trim();
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const raioKm = parseFloat(req.query.raioKm as string) || 50;
    const janela = ((req.query.janela as string) || '48h').trim();
    const conjunto = (req.query.conjunto as string) === 'todosats' ? 'todosats' : 'satref';

    const janelasValidas = ['hoje', '48h', 'mesatual', 'ano_atual'];
    const ehAno = /^20[0-9]{2}$/.test(janela);
    if (!janelasValidas.includes(janela) && !ehAno) {
      return res.status(400).json({
        sucesso: false,
        erro: `Janela inválida: "${janela}". Use hoje, 48h, mesatual, ano_atual ou um ano (ex: 2024).`,
        fonte: 'INPE BDQueimadas (GeoServer)'
      });
    }

    const temCoordenada = Number.isFinite(lat) && Number.isFinite(lng);
    if (!temCoordenada && !uf) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Informe lat/lng (com raioKm opcional) ou estado (UF).',
        fonte: 'INPE BDQueimadas (GeoServer)'
      });
    }

    const bbox = temCoordenada
      ? (() => {
          const { dLat, dLng } = deltaGraus(raioKm, lat);
          return { oeste: lng - dLng, sul: lat - dLat, leste: lng + dLng, norte: lat + dLat };
        })()
      : undefined;

    const r = await consultarFocos({
      janela,
      conjunto: conjunto as 'satref' | 'todosats',
      uf: temCoordenada ? undefined : uf,
      bbox,
      limite: parseInt((req.query.limite as string) || '500', 10)
    });

    if (!r.sucesso) {
      registrarFalhaFonte('/api/focos-inpe', r.erro);
      return res.status(502).json(respostaIndisponivel({
        fonte: r.fonte,
        erro: r.erro,
        motivo: r.motivo,
        consultadoEmUtc: r.consultadoEmUtc,
        orientacaoOperador: 'Não foi possível consultar o GeoServer do INPE. A ausência de focos '
          + 'nesta tela NÃO significa ausência de fogo. Use as abas SIPAM e NASA FIRMS e consulte '
          + 'terrabrasilis.dpi.inpe.br/queimadas/portal antes de concluir sobre materialidade.'
      }));
    }

    return res.json({
      sucesso: true,
      fonte: r.fonte,
      camada: r.dados.camada,
      consultadoEmUtc: r.consultadoEmUtc,
      requerChave: false,
      autenticacao: 'Acesso Aberto Governamental (Sem Chave)',
      janela,
      conjunto,
      escopo: temCoordenada
        ? `Raio aproximado de ${raioKm} km em torno de [${lat.toFixed(4)}, ${lng.toFixed(4)}]`
        : `Unidade federativa ${uf}`,
      quantidade: r.dados.focos.length,
      totalNaFonte: r.dados.totalNaFonte,
      // Se a fonte tem mais focos do que o limite retornado, isso é declarado:
      // truncamento silencioso se leria como cobertura completa.
      truncado: r.dados.totalNaFonte > r.dados.focos.length,
      focos: r.dados.focos,
      mensagem: r.dados.focos.length === 0
        ? 'O GeoServer do INPE respondeu à consulta e não retornou focos para o escopo informado. '
          + 'Satélites têm janela de passagem: fogo sob nuvem ou entre passagens não é detectado.'
        : undefined
    });
  } catch (err: any) {
    registrarFalhaFonte('/api/focos-inpe', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message), focos: [] });
  }
});

// 2.1 Áreas Protegidas — incidência em Terra Indígena ou Unidade de Conservação
//
// Consulta espacial real (INTERSECTS) contra os polígonos oficiais da FUNAI e do MMA
// publicados pelo INPE. Substitui a camada que antes era preenchida com `afetada: false`
// sem consultar nada — negativa falsa que suprimia o Art. 40 da Lei 9.605/98.
app.get('/api/inpe/areas-protegidas', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ sucesso: false, erro: 'Coordenadas não numéricas' });
    }

    const r = await consultarAreasProtegidas(lat, lng);

    if (!r.sucesso && r.areas.length === 0 && r.camadasComFalha.length === r.camadasConsultadas.length) {
      registrarFalhaFonte('/api/inpe/areas-protegidas', r.camadasComFalha.map(c => c.erro).join(' | '));
      return res.status(502).json(respostaIndisponivel({
        fonte: r.fonte,
        erro: r.camadasComFalha.map(c => `${c.camada}: ${c.erro}`).join(' | '),
        motivo: 'REDE',
        consultadoEmUtc: r.consultadoEmUtc,
        orientacaoOperador: 'A incidência em Terra Indígena e Unidade de Conservação NÃO foi '
          + 'verificada. Consulte o CNUC (cnuc.mma.gov.br) e a FUNAI antes de concluir: incidência '
          + 'em UC federal ou TI atrai o Art. 40 da Lei 9.605/98 e a competência da Justiça Federal.'
      }));
    }

    return res.json({
      sucesso: r.sucesso,
      // Verificação parcial é declarada: com camada faltando não se pode afirmar não incidência.
      verificacaoCompleta: r.camadasComFalha.length === 0,
      fonte: r.fonte,
      consultadoEmUtc: r.consultadoEmUtc,
      areas: r.areas,
      competenciaFederalIndicada: r.competenciaFederalIndicada,
      camadasConsultadas: r.camadasConsultadas,
      camadasComFalha: r.camadasComFalha
    });
  } catch (err: any) {
    registrarFalhaFonte('/api/inpe/areas-protegidas', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message), areas: [] });
  }
});

// 3. Focos de Satélite Reais - NASA FIRMS (MODIS / VIIRS 375m)
app.get('/api/focos-nasa', async (req, res) => {
  try {
    const { lat, lng, raioKm, source, country, days } = req.query;
    // A chave vem preferencialmente por header: na query string ela acaba em log de
    // acesso, histórico do navegador e qualquer proxy intermediário.
    const headerKey = (req.get('x-nasa-map-key') || '').trim();
    const mapKey = headerKey || (req.query.mapKey as string)?.trim() || process.env.NASA_FIRMS_MAP_KEY?.trim();

    if (!mapKey) {
      return res.json({
        fonte: 'NASA FIRMS API',
        requerChave: true,
        temChaveConfigurada: false,
        mensagem: 'Chave gratuita NASA FIRMS MAP_KEY não encontrada. Insira sua chave ou configure NASA_FIRMS_MAP_KEY no .env. Enquanto isso, utilize o INPE BDQueimadas (que opera sem chave).',
        focos: []
      });
    }

    // Fonte de satélite da NASA: VIIRS 375m (NOAA-20, NOAA-21, SNPP) ou MODIS 1km
    const validSources = ['VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'VIIRS_SNPP_NRT', 'MODIS_NRT'];
    const chosenSource = validSources.includes(source as string) ? (source as string) : 'VIIRS_NOAA20_NRT';
    const dayRange = Math.min(Math.max(parseInt((days as string) || '1', 10), 1), 5);

    let url = '';
    let escopoDescricao = '';

    // Bounding Box oficial do Brasil no FIRMS: West: -74, South: -34, East: -34, North: 5.5
    // O endpoint /api/country/csv/ da NASA para o Brasil foi descontinuado pela NASA por limitações de polígono
    // A documentação oficial do FIRMS orienta usar a Bounding Box com o endpoint /api/area/csv/
    if (country === 'BRA' || (!lat && !lng)) {
      const BRAZIL_BBOX = '-74,-34,-34,5.5';
      url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${chosenSource}/${BRAZIL_BBOX}/${dayRange}`;
      escopoDescricao = `Abrangência Nacional (Brasil) — Bounding Box [-74, -34, -34, 5.5] nos últimos ${dayRange} dia(s)`;
    } else {
      // Modo Área / Bounding Box ao redor das coordenadas do foco pericial
      const nLat = parseFloat(lat as string);
      const nLng = parseFloat(lng as string);
      const raio = parseFloat(raioKm as string) || 30;

      if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
        return res.status(400).json({ sucesso: false, erro: 'Coordenadas não numéricas', focos: [] });
      }

      // Um grau de longitude encurta com cos(latitude): usar o mesmo delta nos dois
      // eixos varreria uma faixa leste-oeste maior que o raio informado no laudo.
      const { dLat, dLng } = deltaGraus(raio, nLat);

      const west = (nLng - dLng).toFixed(4);
      const south = (nLat - dLat).toFixed(4);
      const east = (nLng + dLng).toFixed(4);
      const north = (nLat + dLat).toFixed(4);
      const bbox = `${west},${south},${east},${north}`;

      url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${chosenSource}/${bbox}/${dayRange}`;
      escopoDescricao = `Raio de ${raio} km em torno de [${nLat.toFixed(4)}, ${nLng.toFixed(4)}] nos últimos ${dayRange} dia(s)`;
    }

    // A cota da NASA é de 5.000 transações por 10 minutos e é COMPARTILHADA por toda
    // a unidade. Antes de gastar uma transação, servimos do cache quando a mesma
    // consulta foi feita há menos de 5 minutos (dados NRT não mudam nesse intervalo).
    const chaveCache = `nasa:${chosenSource}:${url.split('/').slice(-2).join(':')}`;
    const emCache = lerCacheFonte(chaveCache);
    if (emCache) {
      return res.json({
        ...emCache.payload,
        // Declarado: o laudo registra quando a FONTE foi consultada, não quando a
        // tela foi aberta. `consultadoEmUtc` preserva o instante original.
        cacheHit: true,
        idadeCacheSegundos: emCache.idadeSegundos
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SIMIA-Verde-SENASP/1.0',
        'Accept': 'text/csv, application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return res.json({
          fonte: 'NASA FIRMS API',
          requerChave: true,
          chaveInvalida: true,
          mensagem: `A chave fornecida da NASA FIRMS foi recusada pelo servidor (Status ${response.status}). Verifique se a MAP_KEY possui 32 caracteres e está ativa no portal NASA Earthdata.`,
          focos: []
        });
      }
      throw new Error(`NASA FIRMS retornou status ${response.status}`);
    }

    const text = await response.text();
    // Parse CSV retornado pela NASA
    const cleanText = text.replace(/\r/g, '').trim();
    const lines = cleanText.split('\n');
    const headers = lines[0]?.split(',') || [];
    
    // Se a NASA retornar uma mensagem de erro em texto ao invés de CSV
    if (lines[0]?.toLowerCase().includes('invalid map key') || lines[0]?.toLowerCase().includes('error') || lines[0]?.toLowerCase().includes('invalid api call')) {
      return res.json({
        fonte: 'NASA FIRMS API',
        requerChave: true,
        chaveInvalida: lines[0]?.toLowerCase().includes('invalid map key'),
        mensagem: `Resposta do servidor NASA: ${lines[0]}`,
        focos: []
      });
    }

    const items = lines.slice(1).map(l => {
      const parts = l.split(',');
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = parts[i]?.trim();
      });
      return obj;
    }).filter(it => Number.isFinite(parseFloat(it.latitude)) && Number.isFinite(parseFloat(it.longitude)));

    const payload = {
      fonte: `NASA FIRMS (${chosenSource})`,
      sucesso: true,
      requerChave: true,
      temChaveConfigurada: true,
      sensor: chosenSource,
      escopo: escopoDescricao,
      diasConsultados: dayRange,
      consultadoEmUtc: new Date().toISOString(),
      quantidade: items.length,
      focos: items
    };

    gravarCacheFonte(chaveCache, payload, 5 * 60 * 1000);
    return res.json({ ...payload, cacheHit: false });
  } catch (err: any) {
    registrarFalhaFonte('/api/focos-nasa', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message), focos: [] });
  }
});

// 4. Hidrografia Real e Vias Vicinais - OpenStreetMap Overpass API
app.get('/api/osm-overpass', async (req, res) => {
  try {
    const { lat, lng, raioMetros } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat e lng são obrigatórios' });
    }

    const nLat = parseFloat(lat as string);
    const nLng = parseFloat(lng as string);
    const raio = Math.min(parseInt(raioMetros as string) || 3000, 5000);

    // Consulta Overpass buscando:
    // - Cursos d'água (waterway=river, stream, canal, ditch, drain)
    // - Corpos d'água (natural=water, water=reservoir, lake, pond)
    // - Vias rurais/estradas (highway=primary, secondary, tertiary, unclassified, track)
    const overpassQuery = `
      [out:json][timeout:15];
      (
        way["waterway"](around:${raio},${nLat},${nLng});
        relation["waterway"](around:${raio},${nLat},${nLng});
        way["natural"="water"](around:${raio},${nLat},${nLng});
        way["highway"~"primary|secondary|tertiary|unclassified|track|road"](around:${raio},${nLat},${nLng});
      );
      out tags 30;
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(overpassQuery),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SIMIA-Verde-SENASP/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Overpass API retornou ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const hidrografia = elements
      .filter((e: any) => e.tags?.waterway || e.tags?.natural === 'water')
      .map((e: any) => ({
        tipo: e.tags?.waterway || e.tags?.water || 'corpo_dagua',
        nome: e.tags?.name || 'Curso d’água sem denominação cartográfica',
        detalhe: e.tags?.waterway ? `Curso d’água (${e.tags.waterway})` : `Corpo hídrico / Represa / Açude`
      }));

    const vias = elements
      .filter((e: any) => e.tags?.highway)
      .map((e: any) => ({
        tipo: e.tags?.highway,
        nome: e.tags?.name || e.tags?.ref || 'Estrada Vicinal / Acesso Rural',
        pavimento: e.tags?.surface || 'não informado'
      }));

    return res.json({
      sucesso: true,
      raioMetros: raio,
      totalFeicoes: elements.length,
      hidrografia: hidrografia.slice(0, 10),
      vias: vias.slice(0, 10)
    });
  } catch (err: any) {
    console.warn('Erro ao consultar Overpass API:', err.message);
    return res.json({
      sucesso: false,
      mensagem: `Consulta Overpass indisponível no momento: ${err.message}`,
      hidrografia: [],
      vias: []
    });
  }
});

// 5. SIGAMgeo PÚBLICO — SEMIL/SP (ArcGIS REST)
//
// Substitui o WFS do DATAGEO, desativado na origem. Duas camadas:
//   /api/sigamgeo/aia        — Autos de Infração Ambiental (Polícia Ambiental)
//   /api/sigamgeo/incendios  — Boletins de Ocorrência de Incêndio florestal
//
// O raio de busca é SEMPRE devolvido ao cliente: "reincidência" só tem sentido
// pericial se a distância considerada estiver explícita no laudo.

function validarCoordenadaSp(req: any, res: any): { lat: number; lng: number } | null {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ sucesso: false, erro: 'Coordenadas não numéricas' });
    return null;
  }

  // O SIGAMgeo cobre exclusivamente São Paulo. Fora dele, "não há registro" e
  // "esta base não cobre esta UF" são coisas diferentes — e a segunda é a verdadeira.
  if (!dentroDeSaoPaulo(lat, lng)) {
    res.json({
      sucesso: false,
      disponivel: false,
      foraDeCobertura: true,
      fonte: 'SIGAMgeo Público — SEMIL/SP',
      motivo: 'FORA_DE_COBERTURA',
      consultadoEmUtc: new Date().toISOString(),
      mensagem: 'O SIGAMgeo cobre exclusivamente o Estado de São Paulo. A coordenada '
        + 'informada está fora dessa cobertura.',
      orientacaoOperador: 'Consulte o órgão ambiental estadual da UF do fato e o SICAFI/IBAMA. '
        + 'A ausência de registro nesta tela NÃO significa ausência de autuação anterior.',
      registros: []
    });
    return null;
  }

  return { lat, lng };
}

app.get('/api/sigamgeo/aia', async (req, res) => {
  try {
    const c = validarCoordenadaSp(req, res);
    if (!c) return;

    const raioMetros = Math.min(
      Math.max(parseInt((req.query.raioMetros as string) || '2000', 10) || 2000, 100),
      50000
    );

    const chave = `sigam:aia:${c.lat.toFixed(4)}:${c.lng.toFixed(4)}:${raioMetros}`;
    const emCache = lerCacheFonte(chave);
    if (emCache) {
      return res.json({ ...emCache.payload, cacheHit: true, idadeCacheSegundos: emCache.idadeSegundos });
    }

    const r = await consultarAia({ lat: c.lat, lng: c.lng, raioMetros });

    if (!r.sucesso) {
      registrarFalhaFonte('/api/sigamgeo/aia', r.erro);
      return res.status(502).json(respostaIndisponivel({
        fonte: r.fonte,
        erro: r.erro,
        motivo: r.motivo,
        consultadoEmUtc: r.consultadoEmUtc,
        orientacaoOperador: 'O SIGAMgeo não respondeu. O histórico de Auto de Infração Ambiental '
          + 'NÃO foi verificado para esta coordenada. Consulte mapas.semil.sp.gov.br ou requisite '
          + 'certidão à CETESB/SEMIL antes de afirmar ausência de reincidência no laudo.'
      }));
    }

    const payload = {
      sucesso: true,
      fonte: r.fonte,
      consultadoEmUtc: r.consultadoEmUtc,
      raioMetros,
      quantidade: r.dados.autos.length,
      totalNoRaio: r.dados.totalNoRaio,
      truncado: r.dados.truncado,
      registros: r.dados.autos,
      mensagem: r.dados.totalNoRaio === 0
        ? `O SIGAMgeo respondeu à consulta e não retornou Auto de Infração Ambiental num raio `
          + `de ${raioMetros} m da coordenada.`
        : undefined,
      // LGPD: o nome do autuado é dado pessoal e sai apenas em forma reduzida.
      notaLgpd: 'Autuados exibidos de forma anonimizada. A identificação plena se dá por '
        + 'requisição formal da autoridade policial, pelo número do processo.'
    };

    gravarCacheFonte(chave, payload, 10 * 60 * 1000);
    return res.json({ ...payload, cacheHit: false });
  } catch (err: any) {
    registrarFalhaFonte('/api/sigamgeo/aia', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message), registros: [] });
  }
});

app.get('/api/sigamgeo/incendios', async (req, res) => {
  try {
    const c = validarCoordenadaSp(req, res);
    if (!c) return;

    const raioMetros = Math.min(
      Math.max(parseInt((req.query.raioMetros as string) || '5000', 10) || 5000, 100),
      50000
    );

    const chave = `sigam:boi:${c.lat.toFixed(4)}:${c.lng.toFixed(4)}:${raioMetros}`;
    const emCache = lerCacheFonte(chave);
    if (emCache) {
      return res.json({ ...emCache.payload, cacheHit: true, idadeCacheSegundos: emCache.idadeSegundos });
    }

    const r = await consultarBoiIncendio({ lat: c.lat, lng: c.lng, raioMetros });

    if (!r.sucesso) {
      registrarFalhaFonte('/api/sigamgeo/incendios', r.erro);
      return res.status(502).json(respostaIndisponivel({
        fonte: r.fonte,
        erro: r.erro,
        motivo: r.motivo,
        consultadoEmUtc: r.consultadoEmUtc,
        orientacaoOperador: 'Não foi possível consultar os Boletins de Ocorrência de Incêndio. '
          + 'A existência de registro oficial de incêndio no local NÃO foi verificada.'
      }));
    }

    const payload = {
      sucesso: true,
      fonte: r.fonte,
      consultadoEmUtc: r.consultadoEmUtc,
      raioMetros,
      quantidade: r.dados.total,
      registros: r.dados.boletins,
      mensagem: r.dados.total === 0
        ? `O SIGAMgeo respondeu e não retornou Boletim de Ocorrência de Incêndio num raio de `
          + `${raioMetros} m da coordenada.`
        : undefined
    };

    gravarCacheFonte(chave, payload, 10 * 60 * 1000);
    return res.json({ ...payload, cacheHit: false });
  } catch (err: any) {
    registrarFalhaFonte('/api/sigamgeo/incendios', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message), registros: [] });
  }
});

// Cache em memória para municípios por UF
const municipiosCache: Record<string, any[]> = {};

// 6. IBGE - Lista Oficial de Estados (27 UFs)
app.get('/api/ibge-estados', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'SIMIA-Verde-SENASP/1.0' }
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err: any) {
    console.warn('Fallback para lista cadastrada de estados:', err.message);
  }

  // Fallback garantido com os 27 estados cadastrados
  const estadosFallback = Object.entries(UF_IBGE_MAP).map(([sigla, id]) => ({
    id,
    sigla,
    nome: sigla
  }));
  return res.json(estadosFallback);
});

// 7. IBGE - Lista de Municípios por Estado (Suporta todas as 27 UFs)
app.get('/api/ibge-municipios', async (req, res) => {
  try {
    const { uf } = req.query;
    const ufUpper = ((uf as string) || 'SP').toUpperCase().trim();
    const estadoId = UF_IBGE_MAP[ufUpper] || 35;

    // Retornar do cache se já consultado
    if (municipiosCache[ufUpper] && municipiosCache[ufUpper].length > 0) {
      return res.json(municipiosCache[ufUpper]);
    }

    // 1ª Tentativa: API Oficial do IBGE
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'SIMIA-Verde-SENASP/1.0' }
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatados = data.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            microrregiao: m.microrregiao?.nome || '',
            uf: ufUpper
          })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

          municipiosCache[ufUpper] = formatados;
          return res.json(formatados);
        }
      }
    } catch (ibgeErr: any) {
      console.warn(`IBGE API falhou para ${ufUpper}, tentando BrasilAPI:`, ibgeErr.message);
    }

    // 2ª Tentativa (Fallback): BrasilAPI
    try {
      const respBrasilApi = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${ufUpper}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'SIMIA-Verde-SENASP/1.0' }
      });
      if (respBrasilApi.ok) {
        const data = await respBrasilApi.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatados = data.map((m: any) => ({
            id: m.codigo_ibge || m.id,
            nome: m.nome,
            uf: ufUpper
          })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

          municipiosCache[ufUpper] = formatados;
          return res.json(formatados);
        }
      }
    } catch (bApiErr: any) {
      console.warn(`BrasilAPI também falhou para ${ufUpper}:`, bApiErr.message);
    }

    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message, municipios: [] });
  }
});

// -------------------------------------------------------------
// 8. SIPAM / CENSIPAM — PAINEL DO FOGO (Ministério da Defesa)
// API Oficial: https://panorama.sipam.gov.br/painel-do-fogo/api/swagger
// Cobertura de focos e eventos de fogo de até 30 dias (máximo)
// -------------------------------------------------------------

const sipamCache: Record<string, { timestamp: number; data: any }> = {};
const SIPAM_CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache para resposta rápida

// 8.1 Status e Diagnóstico do SIPAM Painel do Fogo
app.get('/api/sipam/status', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const pingRes = await fetch('https://panorama.sipam.gov.br/painel-do-fogo/api/v1/diagnosticos/ping', {
      signal: controller.signal,
      headers: { 'Accept': '*/*', 'User-Agent': 'SIMIA-Verde-SENASP/1.0' }
    });
    clearTimeout(timeout);
    const pingText = await pingRes.text();

    return res.json({
      online: pingRes.ok && pingText.includes('pong'),
      ping: pingText.trim(),
      provedor: 'CENSIPAM — Centro Gestor e Operacional do Sistema de Proteção da Amazônia',
      ministerio: 'Ministério da Defesa (Governo Federal)',
      swaggerUrl: 'https://panorama.sipam.gov.br/painel-do-fogo/api/swagger',
      requerChave: false,
      autenticacao: 'API Governamental 100% Pública e Aberta (Sem necessidade de token)',
      capacidades: [
        'Eventos de Fogo Ativos e em Observação com persistência temporal de até 30 dias',
        'Focos de calor em tempo quase real CENSIPAM (antenas próprias CSPP) de 1 a 24h',
        'Focos de calor FIRMS integrados via CENSIPAM de 1 a 24h',
        'Intersecção de coordenadas com polígonos de incêndio ativo (/eventos/posicao)',
        'Sobreposição de eventos com Cadastro Ambiental Rural (CAR), Terras Indígenas e UCs',
        'Índices operacionais de prioridade de combate e avanço'
      ],
      limiteMaximoHistoricoDias: 30
    });
  } catch (err: any) {
    return res.json({
      online: false,
      mensagem: `Diagnóstico SIPAM indisponível: ${err.message}`,
      requerChave: false
    });
  }
});

// 8.2 Listagem de Eventos de Fogo SIPAM (Filtrável até 30 dias no máximo)
app.get('/api/sipam/eventos', async (req, res) => {
  try {
    const { sigla_estado, municipio, dias, status } = req.query;
    const uf = ((sigla_estado as string) || 'SP').toUpperCase().trim();
    
    // Garantir limite de até 30 dias no máximo
    const diasInt = Math.min(Math.max(parseInt((dias as string) || '30', 10), 1), 30);
    const filtroStatus = (status as string) || 'todos';
    const filtroMun = (municipio as string)?.toLowerCase().trim();

    const cacheKey = `eventos_${uf}`;
    let rawEventos: any[] = [];

    if (sipamCache[cacheKey] && Date.now() - sipamCache[cacheKey].timestamp < SIPAM_CACHE_TTL_MS) {
      rawEventos = sipamCache[cacheKey].data;
    } else {
      const url = `https://panorama.sipam.gov.br/painel-do-fogo/api/v1/eventos?sigla_estado=${encodeURIComponent(uf)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SIMIA-Verde-SENASP/1.0'
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`SIPAM retornou status HTTP ${response.status}`);
      }

      const data = await response.json();
      rawEventos = Array.isArray(data) ? data : [];
      sipamCache[cacheKey] = {
        timestamp: Date.now(),
        data: rawEventos
      };
    }

    // Filtrar pelo limite dos últimos N dias (máximo 30 dias)
    const now = Date.now();
    const cutoffTimestamp = now - diasInt * 24 * 60 * 60 * 1000;

    let filtrados = rawEventos.filter(ev => {
      // Filtrar por data máxima de detecção ou persistência nos últimos N dias
      const dtMax = new Date(ev.dt_maxima).getTime();
      const dtMin = new Date(ev.dt_minima).getTime();
      const dentroJanela = (!isNaN(dtMax) && dtMax >= cutoffTimestamp) || (!isNaN(dtMin) && dtMin >= cutoffTimestamp);
      if (!dentroJanela) return false;

      // Filtro de status se especificado
      if (filtroStatus !== 'todos') {
        if (ev.status_evento !== filtroStatus) return false;
      }

      // Filtro de município se especificado
      if (filtroMun) {
        const munStr = (ev.municipio || '').toLowerCase();
        if (!munStr.includes(filtroMun)) return false;
      }

      return true;
    });

    // Ordenar decrescente por data máxima de visão e área
    filtrados.sort((a, b) => {
      const tB = new Date(b.dt_maxima).getTime();
      const tA = new Date(a.dt_maxima).getTime();
      if (tB !== tA) return tB - tA;
      return (b.area_total_evento || 0) - (a.area_total_evento || 0);
    });

    // Estatísticas agregadas do SIPAM
    const totalAreaKm2 = filtrados.reduce((acc, ev) => acc + (ev.area_total_evento || 0), 0);
    const mediaPersistencia = filtrados.length > 0
      ? Math.round((filtrados.reduce((acc, ev) => acc + (ev.persistencia_dias || 0), 0) / filtrados.length) * 10) / 10
      : 0;
    const totalEmUC = filtrados.filter(ev => Boolean(ev.unidade_conservacao)).length;
    const totalEmTI = filtrados.filter(ev => Boolean(ev.terra_indigena)).length;
    const totalEmQuilombola = filtrados.filter(ev => Boolean(ev.quilombola)).length;

    return res.json({
      sucesso: true,
      fonte: 'SIPAM Painel do Fogo (CENSIPAM / MD)',
      uf,
      diasConsultados: diasInt,
      limiteMaximoConfigurado: 30,
      totalEventosEstado: rawEventos.length,
      quantidadeFiltrada: filtrados.length,
      estatisticas: {
        totalEventos: filtrados.length,
        totalAreaKm2: Math.round(totalAreaKm2 * 100) / 100,
        mediaPersistenciaDias: mediaPersistencia,
        totalEmUC,
        totalEmTI,
        totalEmQuilombola
      },
      eventos: filtrados
    });
  } catch (err: any) {
    console.error('Erro na rota /api/sipam/eventos:', err.message);
    return res.status(500).json({
      sucesso: false,
      fonte: 'SIPAM Painel do Fogo',
      mensagem: `Falha ao consultar eventos do SIPAM: ${err.message}`,
      eventos: []
    });
  }
});

// 8.3 Focos Diretos de Calor do CENSIPAM ou FIRMS (1 a 24 horas retroativas)
app.get('/api/sipam/focos', async (req, res) => {
  try {
    const { origem, horas, estado } = req.query;
    const fonteOrigem = origem === 'firms' ? 'firms' : 'censipam';
    const horasInt = Math.min(Math.max(parseInt((horas as string) || '12', 10), 1), 24);
    const ufFiltro = (estado as string)?.toUpperCase().trim();

    const cacheKey = `focos_${fonteOrigem}_${horasInt}`;
    let rawFocos: any[] = [];

    if (sipamCache[cacheKey] && Date.now() - sipamCache[cacheKey].timestamp < SIPAM_CACHE_TTL_MS) {
      rawFocos = sipamCache[cacheKey].data;
    } else {
      const url = `https://panorama.sipam.gov.br/painel-do-fogo/api/v1/focos/${fonteOrigem}?horas=${horasInt}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SIMIA-Verde-SENASP/1.0'
        }
      });
      clearTimeout(timeout);

      if (response.status === 404) {
        return res.json({
          sucesso: true,
          origem: fonteOrigem === 'censipam' ? 'CENSIPAM (Antenas Próprias CSPP)' : 'FIRMS via CENSIPAM',
          horasConsultadas: horasInt,
          quantidade: 0,
          mensagem: `Nenhum foco de calor detectado nas últimas ${horasInt} horas na rede ${fonteOrigem.toUpperCase()}.`,
          focos: []
        });
      }

      if (!response.ok) {
        throw new Error(`SIPAM retornou status HTTP ${response.status}`);
      }

      const data = await response.json();
      rawFocos = Array.isArray(data) ? data : [];
      sipamCache[cacheKey] = {
        timestamp: Date.now(),
        data: rawFocos
      };
    }

    // Normalizar formato de focos
    // Foco sem geometria é DESCARTADO, não plotado em 0,0 (Golfo da Guiné).
    const formatados = rawFocos.map(f => {
      const lon = Number(f.geom?.coordinates?.[0] ?? f.longitude);
      const lat = Number(f.geom?.coordinates?.[1] ?? f.latitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return {
        id: f.id,
        lat,
        lng: lon,
        satelite: f.satelite || f.satellite || 'Satélite CENSIPAM',
        frp: typeof f.frp === 'number' ? f.frp : undefined,
        // Confiança ausente não vira "nominal": é um qualificador da detecção.
        confidence: f.confidence || undefined,
        // Horário da aquisição ausente fica indefinido — carimbar `new Date()` datava
        // a detecção orbital com o instante da consulta.
        dt_aquisicao: f.dt_aquisicao
          || isoDeAquisicaoFirms(f.acq_date, f.acq_time),
        bright_ti4: f.bright_ti4,
        bright_ti5: f.bright_ti5,
        daynight: f.daynight
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null);

    return res.json({
      sucesso: true,
      origem: fonteOrigem === 'censipam' ? 'CENSIPAM (Antenas Próprias CSPP)' : 'FIRMS via CENSIPAM',
      horasConsultadas: horasInt,
      quantidade: formatados.length,
      focos: formatados
    });
  } catch (err: any) {
    console.error('Erro na rota /api/sipam/focos:', err.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: `Falha ao consultar focos do SIPAM: ${err.message}`,
      focos: []
    });
  }
});

// 8.4 Intersecção de Coordenada com Evento de Fogo Ativo (/eventos/posicao)
app.get('/api/sipam/evento-posicao', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude e Longitude são obrigatórias' });
    }

    const nLat = parseFloat(lat as string);
    const nLng = parseFloat(lng as string);
    if (isNaN(nLat) || isNaN(nLng)) {
      return res.status(400).json({ error: 'Coordenadas numéricas inválidas' });
    }

    const url = `https://panorama.sipam.gov.br/painel-do-fogo/api/v1/eventos/posicao?latitude=${nLat}&longitude=${nLng}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SIMIA-Verde-SENASP/1.0'
      }
    });
    clearTimeout(timeout);

    if (response.status === 404) {
      return res.json({
        sucesso: true,
        encontrado: false,
        mensagem: 'Nenhum polígono de evento de fogo ativo intersecta este par de coordenadas no Painel do Fogo.'
      });
    }

    if (!response.ok) {
      throw new Error(`SIPAM retornou status HTTP ${response.status}`);
    }

    const evento = await response.json();
    return res.json({
      sucesso: true,
      encontrado: true,
      evento
    });
  } catch (err: any) {
    return res.json({
      sucesso: false,
      encontrado: false,
      mensagem: `Consulta por coordenada não pôde ser completada: ${err.message}`
    });
  }
});

// 8.5 Detalhes Completos do Evento: Detecções, Propriedades CAR e Prioridades
app.get('/api/sipam/evento-detalhes/:id', async (req, res) => {
  try {
    const idEvento = req.params.id;
    if (!idEvento) return res.status(400).json({ error: 'ID do evento é obrigatório' });

    const baseUrl = `https://panorama.sipam.gov.br/painel-do-fogo/api/v1/eventos/${idEvento}`;
    const headers = { 'Accept': 'application/json', 'User-Agent': 'SIMIA-Verde-SENASP/1.0' };

    const [evRes, detRes, carsRes, prioRes] = await Promise.all([
      fetch(baseUrl, { headers }).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${baseUrl}/deteccoes`, { headers }).then(r => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`${baseUrl}/cars`, { headers }).then(r => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`${baseUrl}/prioridades`, { headers }).then(r => (r.ok ? r.json() : [])).catch(() => [])
    ]);

    return res.json({
      sucesso: true,
      idEvento,
      evento: evRes,
      deteccoes: Array.isArray(detRes) ? detRes : [],
      propriedadesCar: Array.isArray(carsRes) ? carsRes : [],
      prioridades: Array.isArray(prioRes) ? prioRes : []
    });
  } catch (err: any) {
    return res.status(500).json({
      sucesso: false,
      mensagem: `Erro ao buscar detalhes do evento SIPAM: ${err.message}`
    });
  }
});

// 7. Geocodificação Reversa (Nominatim / OpenStreetMap)
// Estava sendo chamada DIRETAMENTE do navegador, o que (a) violava o isolamento do
// proxy, (b) expunha a coordenada do fato ao terceiro a partir da estação do operador
// e (c) não cumpria a política de uso do Nominatim: o cabeçalho User-Agent é proibido
// no fetch do navegador e era silenciosamente descartado.
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const nLat = parseFloat(req.query.lat as string);
    const nLng = parseFloat(req.query.lng as string);

    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
      return res.status(400).json({ sucesso: false, erro: 'Coordenadas não numéricas' });
    }

    const r = await consultarFonte<any>({
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLng}&zoom=10&addressdetails=1`,
      fonte: 'Nominatim / OpenStreetMap',
      timeoutMs: 8000,
      validar: d => d && typeof d === 'object'
    });

    if (!r.sucesso) {
      registrarFalhaFonte('/api/reverse-geocode', r.erro);
      return res.status(502).json(respostaIndisponivel({
        fonte: r.fonte,
        erro: r.erro,
        motivo: r.motivo,
        consultadoEmUtc: r.consultadoEmUtc,
        orientacaoOperador: 'Não foi possível identificar município, UF e comarca por geocodificação. '
          + 'Informe-os manualmente: a comarca define a competência jurisdicional do laudo.'
      }));
    }

    const addr = r.dados.address || {};
    const municipio = addr.city || addr.town || addr.municipality || addr.village || addr.county || null;
    const ufBruta = addr['ISO3166-2-lvl4']?.replace('BR-', '') || addr.state || null;

    // Se o serviço respondeu mas não identificou a localidade, isso é declarado —
    // nunca completado com um município ou UF plausível.
    return res.json({
      sucesso: true,
      fonte: r.fonte,
      consultadoEmUtc: r.consultadoEmUtc,
      identificado: Boolean(municipio && ufBruta),
      municipio,
      uf: ufBruta,
      enderecoBruto: addr
    });
  } catch (err: any) {
    registrarFalhaFonte('/api/reverse-geocode', err);
    return res.status(500).json({ sucesso: false, erro: mascararSegredos(err.message) });
  }
});

// -------------------------------------------------------------
// PERSISTÊNCIA PERICIAL (SQLite) E CADEIA DE CUSTÓDIA
// -------------------------------------------------------------

/**
 * Health check do contêiner.
 * Verifica DELIBERADAMENTE apenas o processo e o banco: APIs governamentais caem com
 * frequência e isso é uma condição operacional normal e prevista, não um contêiner doente.
 */
app.get('/api/health', (_req, res) => {
  const banco = diagnosticarBanco();
  return res.status(banco.operacional ? 200 : 503).json({
    servico: 'SIMIA-Verde',
    operacional: banco.operacional,
    instanteUtc: new Date().toISOString(),
    banco
  });
});

// Lista todos os dossiês persistidos
app.get('/api/ocorrencias', (_req, res) => {
  try {
    const { dossies, corrompidas } = listarOcorrencias();
    return res.json({
      sucesso: true,
      total: dossies.length,
      ocorrencias: dossies,
      // Registro corrompido é declarado, nunca omitido nem substituído por objeto plausível.
      corrompidas,
      fonte: 'Base Pericial Local SIMIA-Verde (SQLite)'
    });
  } catch (err: any) {
    console.error('Erro na rota GET /api/ocorrencias:', err.message);
    return res.status(500).json({ sucesso: false, erro: err.message, fonte: 'Base Pericial Local SIMIA-Verde (SQLite)' });
  }
});

// Recupera um dossiê específico
app.get('/api/ocorrencias/:id', (req, res) => {
  try {
    const dossie = obterOcorrencia(req.params.id);
    if (!dossie) {
      return res.status(404).json({ sucesso: false, erro: 'Dossiê não localizado na base pericial' });
    }
    return res.json({ sucesso: true, ocorrencia: dossie });
  } catch (err: any) {
    console.error('Erro na rota GET /api/ocorrencias/:id:', err.message);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Grava ou atualiza um dossiê e registra o evento de custódia correspondente
app.post('/api/ocorrencias', (req, res) => {
  try {
    const dossie = req.body?.ocorrencia;
    const input = dossie?.input;
    const custodia = dossie?.custodia;

    // Validação estrita: sem os campos periciais obrigatórios o registro é recusado,
    // nunca completado com valor inferido.
    if (!input?.id || !input?.timestampUtc || !input?.operadorId || !custodia?.sha256Hex) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dossiê inválido: exigidos input.id, input.timestampUtc, input.operadorId e custodia.sha256Hex'
      });
    }
    if (typeof input.coordenadas?.lat !== 'number' || typeof input.coordenadas?.lng !== 'number') {
      return res.status(400).json({ sucesso: false, erro: 'Dossiê inválido: coordenadas ausentes ou não numéricas' });
    }

    const agoraUtc = new Date().toISOString();

    const { criado } = salvarOcorrencia({
      id: input.id,
      timestampUtc: input.timestampUtc,
      operadorId: input.operadorId,
      latitude: input.coordenadas.lat,
      longitude: input.coordenadas.lng,
      municipio: input.municipio ?? '',
      uf: input.uf ?? '',
      comarca: input.comarca ?? '',
      sha256Custodia: custodia.sha256Hex,
      dossieJson: JSON.stringify(dossie),
      agoraUtc
    });

    const etapa = criado ? 'ACONDICIONAMENTO' : 'REPROCESSAMENTO';

    registrarEventoCustodia({
      ocorrenciaId: input.id,
      etapa,
      registradoEmUtc: agoraUtc,
      operadorId: input.operadorId,
      sha256Custodia: custodia.sha256Hex,
      detalhe: criado
        ? `Dossiê pericial acondicionado na base durável. Coordenada ${input.coordenadas.lat.toFixed(6)}, ${input.coordenadas.lng.toFixed(6)} — ${input.municipio}/${input.uf}.`
        : `Dossiê reprocessado e regravado. Hash de custódia vigente: ${custodia.sha256Hex}.`
    });

    return res.json({ sucesso: true, criado, id: input.id, registradoEmUtc: agoraUtc });
  } catch (err: any) {
    console.error('Erro na rota POST /api/ocorrencias:', err.message);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Remove o dossiê da base operacional — o livro de custódia preserva o histórico
app.delete('/api/ocorrencias/:id', (req, res) => {
  try {
    const id = req.params.id;
    const operadorId = (req.query.operadorId as string)?.trim() || 'OPERADOR-NAO-IDENTIFICADO';
    const agoraUtc = new Date().toISOString();

    const removido = removerOcorrencia(id);
    if (!removido) {
      return res.status(404).json({ sucesso: false, erro: 'Dossiê não localizado na base pericial' });
    }

    // O evento de remoção é gravado no livro append-only: a exclusão é ela própria
    // um ato rastreável da cadeia de custódia.
    registrarEventoCustodia({
      ocorrenciaId: id,
      etapa: 'REMOCAO',
      registradoEmUtc: agoraUtc,
      operadorId,
      detalhe: 'Dossiê removido da base operacional. Histórico de custódia preservado neste livro.'
    });

    return res.json({ sucesso: true, id, removidoEmUtc: agoraUtc });
  } catch (err: any) {
    console.error('Erro na rota DELETE /api/ocorrencias/:id:', err.message);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Livro de cadeia de custódia da ocorrência (CPP Art. 158-A a 158-F)
app.get('/api/ocorrencias/:id/custodia', (req, res) => {
  try {
    const eventos = listarEventosCustodia(req.params.id);
    return res.json({
      sucesso: true,
      ocorrenciaId: req.params.id,
      total: eventos.length,
      eventos,
      natureza: 'Livro append-only — eventos não podem ser alterados nem removidos (CPP Art. 158-A)'
    });
  } catch (err: any) {
    console.error('Erro na rota GET /api/ocorrencias/:id/custodia:', err.message);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC FILES
// -------------------------------------------------------------
async function startServer() {
  // O banco precisa estar operacional antes de aceitar tráfego: um dossiê processado
  // e não persistido é perda de prova.
  inicializarBanco();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMIA-Verde Server operacional em http://0.0.0.0:${PORT}`);
  });
}

startServer();
