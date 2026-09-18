import { OcorrenciaCompleta } from '../types';

const STORAGE_KEY = 'simia_dossies_forenses_v1';
const ACTIVE_ID_KEY = 'simia_active_dossie_id_v1';

/**
 * Persistência em duas camadas:
 *
 *  - localStorage  → cache offline, garante trabalho de campo com conexão intermitente
 *  - SQLite (API)  → sistema de registro durável e auditável, com livro de cadeia de custódia
 *
 * As funções síncronas abaixo operam no cache local e mantêm o comportamento original.
 * A sincronização com o servidor é assíncrona e explícita.
 */

// -------------------------------------------------------------
// CACHE LOCAL (offline)
// -------------------------------------------------------------

/**
 * Recupera todas as ocorrências armazenadas localmente no navegador
 */
export function getSavedOcorrencias(): OcorrenciaCompleta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Falha ao carregar ocorrências salvas:', err);
    return [];
  }
}

/**
 * Salva a lista de ocorrências no localStorage
 */
export function saveOcorrencias(lista: OcorrenciaCompleta[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (err) {
    console.error('Falha ao persistir ocorrências no storage:', err);
  }
}

/**
 * Recupera o ID da ocorrência que estava ativa por último
 */
export function getSavedActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Salva o ID da ocorrência ativa
 */
export function saveActiveId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  } catch {
    // ignore
  }
}

// -------------------------------------------------------------
// BASE PERICIAL DURÁVEL (SQLite via /api/ocorrencias)
// -------------------------------------------------------------

/**
 * Estado da persistência durável, exibido ao operador.
 * O perito precisa saber se o dossiê está apenas no navegador ou já gravado na base.
 */
export type StatusPersistencia =
  | 'VERIFICANDO'
  | 'SINCRONIZADO'   // base durável respondeu e está em dia
  | 'SOMENTE_LOCAL'; // base indisponível — dossiês vivem apenas neste navegador

export interface ResultadoSincronizacao {
  status: StatusPersistencia;
  ocorrencias: OcorrenciaCompleta[];
  enviadas: number;
  corrompidas: Array<{ id: string; erro: string }>;
  erro?: string;
}

export async function fetchOcorrenciasServidor(): Promise<{
  sucesso: boolean;
  ocorrencias: OcorrenciaCompleta[];
  corrompidas: Array<{ id: string; erro: string }>;
  erro?: string;
}> {
  try {
    const res = await fetch('/api/ocorrencias');
    if (!res.ok) throw new Error(`Base pericial retornou status ${res.status}`);
    const json = await res.json();
    if (!json?.sucesso) throw new Error(json?.erro || 'Resposta inválida da base pericial');
    return {
      sucesso: true,
      ocorrencias: Array.isArray(json.ocorrencias) ? json.ocorrencias : [],
      corrompidas: Array.isArray(json.corrompidas) ? json.corrompidas : []
    };
  } catch (err: any) {
    console.error('Base pericial durável indisponível:', err.message);
    return { sucesso: false, ocorrencias: [], corrompidas: [], erro: err.message };
  }
}

export async function persistirOcorrenciaServidor(
  ocorrencia: OcorrenciaCompleta
): Promise<{ sucesso: boolean; criado?: boolean; erro?: string }> {
  try {
    const res = await fetch('/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ocorrencia })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.sucesso) {
      throw new Error(json?.erro || `Base pericial retornou status ${res.status}`);
    }
    return { sucesso: true, criado: json.criado };
  } catch (err: any) {
    console.error('Falha ao gravar dossiê na base pericial:', err.message);
    return { sucesso: false, erro: err.message };
  }
}

export async function removerOcorrenciaServidor(
  id: string,
  operadorId: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const res = await fetch(
      `/api/ocorrencias/${encodeURIComponent(id)}?operadorId=${encodeURIComponent(operadorId)}`,
      { method: 'DELETE' }
    );
    // 404 significa que o dossiê nunca chegou à base durável (criado offline): não é erro.
    if (res.status === 404) return { sucesso: true };
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.sucesso) {
      throw new Error(json?.erro || `Base pericial retornou status ${res.status}`);
    }
    return { sucesso: true };
  } catch (err: any) {
    console.error('Falha ao remover dossiê da base pericial:', err.message);
    return { sucesso: false, erro: err.message };
  }
}

/**
 * Consulta o livro append-only de cadeia de custódia de uma ocorrência (CPP Art. 158-A).
 */
export async function fetchCustodiaServidor(id: string): Promise<{
  sucesso: boolean;
  eventos: Array<{
    id: number;
    etapa: string;
    registradoEmUtc: string;
    operadorId: string;
    sha256Custodia: string | null;
    detalhe: string | null;
  }>;
  erro?: string;
}> {
  try {
    const res = await fetch(`/api/ocorrencias/${encodeURIComponent(id)}/custodia`);
    if (!res.ok) throw new Error(`Base pericial retornou status ${res.status}`);
    const json = await res.json();
    if (!json?.sucesso) throw new Error(json?.erro || 'Resposta inválida da base pericial');
    return { sucesso: true, eventos: Array.isArray(json.eventos) ? json.eventos : [] };
  } catch (err: any) {
    console.error('Livro de custódia indisponível:', err.message);
    return { sucesso: false, eventos: [], erro: err.message };
  }
}

/**
 * Reconcilia o cache local com a base durável.
 *
 * Regra de união, deliberadamente conservadora: nenhum dossiê é descartado.
 * A base durável é a referência; dossiês que existem apenas localmente (criados
 * offline) são enviados para ela. Em caso de mesmo ID nas duas pontas, prevalece a
 * versão da base — é ela que tem o evento de custódia registrado.
 *
 * Se a base estiver indisponível, devolve a lista local intacta com status
 * SOMENTE_LOCAL. Nada é perdido e o operador é informado da condição.
 */
export async function sincronizarComServidor(
  locais: OcorrenciaCompleta[]
): Promise<ResultadoSincronizacao> {
  const remoto = await fetchOcorrenciasServidor();

  if (!remoto.sucesso) {
    return {
      status: 'SOMENTE_LOCAL',
      ocorrencias: locais,
      enviadas: 0,
      corrompidas: [],
      erro: remoto.erro
    };
  }

  const idsRemotos = new Set(remoto.ocorrencias.map(o => o.input.id));
  const apenasLocais = locais.filter(o => !idsRemotos.has(o.input.id));

  let enviadas = 0;
  for (const oc of apenasLocais) {
    const r = await persistirOcorrenciaServidor(oc);
    if (r.sucesso) enviadas++;
  }

  const unificadas = [...remoto.ocorrencias, ...apenasLocais].sort((a, b) =>
    b.input.timestampUtc.localeCompare(a.input.timestampUtc)
  );

  return {
    status: 'SINCRONIZADO',
    ocorrencias: unificadas,
    enviadas,
    corrompidas: remoto.corrompidas
  };
}
