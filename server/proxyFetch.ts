/**
 * Helper compartilhado de acesso a fontes governamentais externas.
 *
 * Existe para eliminar a duplicação de AbortController/User-Agent/tratamento de erro
 * que estava replicada em cada rota, e — mais importante — para tornar
 * estruturalmente impossível confundir "a fonte não respondeu" com "a fonte
 * respondeu que não há registro".
 *
 * O retorno é um tipo discriminado: quem consome é obrigado a olhar `sucesso`
 * antes de alcançar os dados.
 */

export type ResultadoFonte<T> =
  | { sucesso: true; dados: T; fonte: string; consultadoEmUtc: string }
  | {
      sucesso: false;
      erro: string;
      motivo: 'TIMEOUT' | 'HTTP' | 'FORMATO' | 'REDE';
      status?: number;
      fonte: string;
      consultadoEmUtc: string;
    };

const TIMEOUT_PADRAO_MS = 9000;
const USER_AGENT = 'SIMIA-Verde-SENASP/1.0';

/**
 * Remove segredos de qualquer texto antes de ir para log.
 * Mensagens de erro de fetch frequentemente carregam a URL completa, e a MAP_KEY
 * da NASA viaja na URL — sem isto, a chave acaba no log do servidor.
 */
export function mascararSegredos(texto: string): string {
  if (!texto) return texto;
  return texto
    .replace(/(MAP_KEY=)[^&\s]+/gi, '$1****')
    .replace(/(\/api\/(?:area|country)\/csv\/)[^/]+/gi, '$1****')
    .replace(/(mapKey=)[^&\s]+/gi, '$1****')
    .replace(/(api[_-]?key=)[^&\s]+/gi, '$1****');
}

export function registrarFalhaFonte(rota: string, erro: unknown): void {
  const msg = erro instanceof Error ? erro.message : String(erro);
  console.error(`[SIMIA] Falha em ${rota}: ${mascararSegredos(msg)}`);
}

/**
 * Executa a consulta a uma fonte externa com timeout, identificação e validação.
 *
 * `validar` inspeciona o corpo já parseado: um HTTP 200 carregando página de erro
 * HTML é comum em API gov.br, então validar apenas o status não basta.
 */
export async function consultarFonte<T>(params: {
  url: string;
  fonte: string;
  timeoutMs?: number;
  metodo?: 'GET' | 'POST';
  corpo?: string;
  headers?: Record<string, string>;
  formato?: 'json' | 'texto';
  validar?: (dados: any) => boolean;
}): Promise<ResultadoFonte<T>> {
  const consultadoEmUtc = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? TIMEOUT_PADRAO_MS);

  try {
    const response = await fetch(params.url, {
      method: params.metodo ?? 'GET',
      body: params.corpo,
      signal: controller.signal,
      headers: {
        'Accept': params.formato === 'texto' ? 'text/csv, text/plain, application/json' : 'application/json',
        'User-Agent': USER_AGENT,
        ...params.headers
      }
    });

    if (!response.ok) {
      return {
        sucesso: false,
        erro: `${params.fonte} retornou status HTTP ${response.status}`,
        motivo: 'HTTP',
        status: response.status,
        fonte: params.fonte,
        consultadoEmUtc
      };
    }

    let dados: any;
    if (params.formato === 'texto') {
      dados = await response.text();
    } else {
      const texto = await response.text();
      try {
        dados = JSON.parse(texto);
      } catch {
        return {
          sucesso: false,
          erro: `${params.fonte} respondeu HTTP 200 com conteúdo que não é JSON (possível página de erro do órgão)`,
          motivo: 'FORMATO',
          fonte: params.fonte,
          consultadoEmUtc
        };
      }
    }

    if (params.validar && !params.validar(dados)) {
      return {
        sucesso: false,
        erro: `${params.fonte} respondeu em formato inesperado`,
        motivo: 'FORMATO',
        fonte: params.fonte,
        consultadoEmUtc
      };
    }

    return { sucesso: true, dados: dados as T, fonte: params.fonte, consultadoEmUtc };
  } catch (err: any) {
    const abortado = err?.name === 'AbortError';
    return {
      sucesso: false,
      erro: abortado
        ? `${params.fonte} não respondeu dentro de ${params.timeoutMs ?? TIMEOUT_PADRAO_MS}ms`
        : mascararSegredos(err?.message ?? String(err)),
      motivo: abortado ? 'TIMEOUT' : 'REDE',
      fonte: params.fonte,
      consultadoEmUtc
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Corpo padronizado de indisponibilidade.
 *
 * Toda rota devolve esta forma quando a fonte falha, para que o cliente traduza
 * sempre em `confiabilidade: 'INDISPONIVEL'`. Nunca devolve dado sintético e
 * nunca afirma que a consulta ocorreu.
 */
export function respostaIndisponivel(params: {
  fonte: string;
  erro: string;
  motivo: string;
  consultadoEmUtc: string;
  orientacaoOperador: string;
}) {
  return {
    sucesso: false,
    disponivel: false,
    fonte: params.fonte,
    erro: params.erro,
    motivo: params.motivo,
    consultadoEmUtc: params.consultadoEmUtc,
    // O que o operador faz agora. Indisponibilidade sem orientação é beco sem saída.
    orientacaoOperador: params.orientacaoOperador,
    registros: [],
    focos: []
  };
}

/**
 * Corrige o delta de longitude pela latitude.
 *
 * Um grau de longitude encurta com o cosseno da latitude: usar o mesmo delta nos
 * dois eixos produz uma caixa alongada no sentido leste-oeste, e o raio informado
 * no laudo deixa de corresponder à área efetivamente varrida.
 */
export function deltaGraus(raioKm: number, latitude: number): { dLat: number; dLng: number } {
  const dLat = raioKm / 111.32;
  const cos = Math.cos((latitude * Math.PI) / 180);
  const dLng = raioKm / (111.32 * Math.max(0.01, Math.abs(cos)));
  return { dLat, dLng };
}

// -------------------------------------------------------------
// CACHE DE CURTA DURAÇÃO
// -------------------------------------------------------------
/**
 * Protege cotas de API e reduz latência.
 *
 * Existe principalmente pela NASA FIRMS, que limita a 5.000 transações por janela
 * de 10 minutos: sem cache, um operador navegando entre as sub-abas de satélite
 * consome a cota da unidade inteira em poucos minutos.
 *
 * REGRA PERICIAL: a resposta servida do cache preserva o `consultadoEmUtc` da
 * consulta ORIGINAL e declara `cacheHit` e a idade em segundos. O laudo precisa
 * registrar quando a fonte foi efetivamente consultada, não quando a tela foi aberta.
 */
interface EntradaCache {
  expiraEm: number;
  gravadoEm: number;
  payload: any;
}

const cacheFontes = new Map<string, EntradaCache>();
const CACHE_MAX_ENTRADAS = 200;

export function lerCacheFonte(chave: string): { payload: any; idadeSegundos: number } | null {
  const e = cacheFontes.get(chave);
  if (!e) return null;

  const agora = Date.now();
  if (agora > e.expiraEm) {
    cacheFontes.delete(chave);
    return null;
  }

  return {
    payload: e.payload,
    idadeSegundos: Math.round((agora - e.gravadoEm) / 1000)
  };
}

export function gravarCacheFonte(chave: string, payload: any, ttlMs: number): void {
  // Descarta a entrada mais antiga quando o limite é atingido: o cache é uma
  // otimização, não pode virar vazamento de memória num processo de plantão.
  if (cacheFontes.size >= CACHE_MAX_ENTRADAS) {
    const maisAntiga = cacheFontes.keys().next().value;
    if (maisAntiga !== undefined) cacheFontes.delete(maisAntiga);
  }

  const agora = Date.now();
  cacheFontes.set(chave, { payload, gravadoEm: agora, expiraEm: agora + ttlMs });
}
