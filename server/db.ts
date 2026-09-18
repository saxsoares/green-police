/**
 * Camada de Persistência Durável do SIMIA-Verde (SQLite)
 *
 * Sistema de registro dos dossiês periciais e do livro de cadeia de custódia.
 * O localStorage do navegador permanece como cache offline para trabalho de campo;
 * este módulo é a fonte durável e auditável.
 *
 * Princípio pericial: este módulo ARMAZENA e DEVOLVE exatamente o que recebeu.
 * Nunca preenche campo ausente, nunca normaliza valor, nunca sintetiza registro.
 * Leitura que falha é reportada como falha — jamais substituída por objeto plausível.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const SCHEMA_VERSAO_ATUAL = 1;

export type EtapaCustodia =
  | 'FIXACAO'          // registro inicial de coordenada e horário
  | 'COLETA'           // ingestão de dados de satélite e meteorologia
  | 'ACONDICIONAMENTO' // geração do dossiê digital
  | 'REPROCESSAMENTO'  // reanálise com novos parâmetros (ex: meteorologia ao vivo)
  | 'REMOCAO';         // exclusão do dossiê da base operacional

export interface RegistroOcorrencia {
  id: string;
  timestampUtc: string;
  operadorId: string;
  latitude: number;
  longitude: number;
  municipio: string;
  uf: string;
  comarca: string;
  sha256Custodia: string;
  dossieJson: string;
  criadoEmUtc: string;
  atualizadoEmUtc: string;
}

export interface EventoCustodia {
  id: number;
  ocorrenciaId: string;
  etapa: EtapaCustodia;
  registradoEmUtc: string;
  operadorId: string;
  sha256Custodia: string | null;
  detalhe: string | null;
}

let db: Database.Database | null = null;

/**
 * Caminho do arquivo de banco. Em Docker aponta para o volume montado em /app/data.
 */
export function resolverCaminhoBanco(): string {
  const configurado = process.env.SIMIA_DB_PATH?.trim();
  if (configurado) return configurado;
  return path.join(process.cwd(), 'data', 'simia.db');
}

/**
 * Abre (ou cria) o banco e aplica o esquema. Idempotente.
 */
export function inicializarBanco(): Database.Database {
  if (db) return db;

  const caminho = resolverCaminhoBanco();
  const diretorio = path.dirname(caminho);

  try {
    fs.mkdirSync(diretorio, { recursive: true });
    // Falha cedo e com diagnóstico: um SQLITE_CANTOPEN cru não diz ao operador
    // que o problema é permissão de escrita no diretório montado.
    fs.accessSync(diretorio, fs.constants.W_OK);
  } catch (err: any) {
    const uid = typeof process.getuid === 'function' ? process.getuid() : 'n/d';
    const gid = typeof process.getgid === 'function' ? process.getgid() : 'n/d';
    throw new Error(
      [
        `Não foi possível abrir a base pericial em ${caminho}.`,
        `Diretório: ${diretorio}`,
        `Processo rodando como uid=${uid} gid=${gid}`,
        `Causa: ${err.message}`,
        '',
        'Em Docker isto costuma ser propriedade do bind mount: a pasta ./data do host',
        'pertence a root e o contêiner roda sem privilégio. Corrija no host com:',
        '  sudo chown -R 1000:1000 ./data',
        'e suba novamente com: docker compose up -d --build'
      ].join('\n')
    );
  }

  db = new Database(caminho);

  // WAL permite leitura concorrente durante escrita — relevante quando o operador
  // consulta o dossiê enquanto uma reanálise está sendo gravada.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  aplicarEsquema(db);

  console.log(`SIMIA-Verde: banco pericial em ${caminho} (esquema v${SCHEMA_VERSAO_ATUAL})`);
  return db;
}

function aplicarEsquema(conexao: Database.Database): void {
  const versaoAtual = conexao.pragma('user_version', { simple: true }) as number;

  if (versaoAtual < 1) {
    conexao.exec(`
      CREATE TABLE IF NOT EXISTS ocorrencias (
        id                TEXT PRIMARY KEY,
        timestamp_utc     TEXT NOT NULL,
        operador_id       TEXT NOT NULL,
        latitude          REAL NOT NULL,
        longitude         REAL NOT NULL,
        municipio         TEXT NOT NULL,
        uf                TEXT NOT NULL,
        comarca           TEXT NOT NULL,
        sha256_custodia   TEXT NOT NULL,
        dossie_json       TEXT NOT NULL,
        criado_em_utc     TEXT NOT NULL,
        atualizado_em_utc TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ocorrencias_uf        ON ocorrencias (uf);
      CREATE INDEX IF NOT EXISTS idx_ocorrencias_timestamp ON ocorrencias (timestamp_utc DESC);
      CREATE INDEX IF NOT EXISTS idx_ocorrencias_operador  ON ocorrencias (operador_id);

      /*
       * Livro de cadeia de custódia — CPP Art. 158-A a 158-F.
       * Deliberadamente SEM foreign key com ON DELETE CASCADE: o histórico de custódia
       * precisa sobreviver à remoção do dossiê, inclusive registrando a própria remoção.
       */
      CREATE TABLE IF NOT EXISTS custodia_eventos (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        ocorrencia_id     TEXT NOT NULL,
        etapa             TEXT NOT NULL,
        registrado_em_utc TEXT NOT NULL,
        operador_id       TEXT NOT NULL,
        sha256_custodia   TEXT,
        detalhe           TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_custodia_ocorrencia ON custodia_eventos (ocorrencia_id, id);

      /*
       * O livro de custódia é append-only. Alterar ou apagar um evento destruiria a
       * rastreabilidade que o Art. 158-A exige, então o próprio banco recusa.
       */
      CREATE TRIGGER IF NOT EXISTS custodia_eventos_bloqueia_update
        BEFORE UPDATE ON custodia_eventos
        BEGIN
          SELECT RAISE(ABORT, 'Cadeia de custodia e append-only: evento nao pode ser alterado');
        END;

      CREATE TRIGGER IF NOT EXISTS custodia_eventos_bloqueia_delete
        BEFORE DELETE ON custodia_eventos
        BEGIN
          SELECT RAISE(ABORT, 'Cadeia de custodia e append-only: evento nao pode ser removido');
        END;
    `);
    conexao.pragma(`user_version = 1`);
  }

  // Migrações futuras: if (versaoAtual < 2) { ... conexao.pragma('user_version = 2') }
}

function conexao(): Database.Database {
  return db ?? inicializarBanco();
}

// -------------------------------------------------------------
// OCORRÊNCIAS
// -------------------------------------------------------------

/**
 * Grava ou atualiza um dossiê. O JSON é armazenado verbatim — nenhum campo é
 * inferido, completado ou normalizado.
 */
export function salvarOcorrencia(params: {
  id: string;
  timestampUtc: string;
  operadorId: string;
  latitude: number;
  longitude: number;
  municipio: string;
  uf: string;
  comarca: string;
  sha256Custodia: string;
  dossieJson: string;
  agoraUtc: string;
}): { criado: boolean } {
  const c = conexao();

  const existente = c
    .prepare('SELECT id, sha256_custodia FROM ocorrencias WHERE id = ?')
    .get(params.id) as { id: string; sha256_custodia: string } | undefined;

  c.prepare(`
    INSERT INTO ocorrencias (
      id, timestamp_utc, operador_id, latitude, longitude,
      municipio, uf, comarca, sha256_custodia, dossie_json,
      criado_em_utc, atualizado_em_utc
    ) VALUES (
      @id, @timestampUtc, @operadorId, @latitude, @longitude,
      @municipio, @uf, @comarca, @sha256Custodia, @dossieJson,
      @agoraUtc, @agoraUtc
    )
    ON CONFLICT(id) DO UPDATE SET
      timestamp_utc     = excluded.timestamp_utc,
      operador_id       = excluded.operador_id,
      latitude          = excluded.latitude,
      longitude         = excluded.longitude,
      municipio         = excluded.municipio,
      uf                = excluded.uf,
      comarca           = excluded.comarca,
      sha256_custodia   = excluded.sha256_custodia,
      dossie_json       = excluded.dossie_json,
      atualizado_em_utc = excluded.atualizado_em_utc
  `).run(params);

  return { criado: !existente };
}

/**
 * Lista os dossiês. Uma linha ilegível é reportada, nunca substituída por um
 * objeto sintético — o operador precisa saber que o registro está corrompido.
 */
export function listarOcorrencias(): {
  dossies: unknown[];
  corrompidas: Array<{ id: string; erro: string }>;
} {
  const linhas = conexao()
    .prepare('SELECT id, dossie_json FROM ocorrencias ORDER BY timestamp_utc DESC')
    .all() as Array<{ id: string; dossie_json: string }>;

  const dossies: unknown[] = [];
  const corrompidas: Array<{ id: string; erro: string }> = [];

  for (const linha of linhas) {
    try {
      dossies.push(JSON.parse(linha.dossie_json));
    } catch (err: any) {
      corrompidas.push({ id: linha.id, erro: `JSON ilegível: ${err.message}` });
    }
  }

  return { dossies, corrompidas };
}

export function obterOcorrencia(id: string): unknown | null {
  const linha = conexao()
    .prepare('SELECT dossie_json FROM ocorrencias WHERE id = ?')
    .get(id) as { dossie_json: string } | undefined;

  if (!linha) return null;
  return JSON.parse(linha.dossie_json); // erro de parse sobe para o chamador: é falha real
}

export function removerOcorrencia(id: string): boolean {
  const r = conexao().prepare('DELETE FROM ocorrencias WHERE id = ?').run(id);
  return r.changes > 0;
}

export function contarOcorrencias(): number {
  const r = conexao().prepare('SELECT COUNT(*) AS total FROM ocorrencias').get() as { total: number };
  return r.total;
}

// -------------------------------------------------------------
// CADEIA DE CUSTÓDIA (append-only)
// -------------------------------------------------------------

export function registrarEventoCustodia(params: {
  ocorrenciaId: string;
  etapa: EtapaCustodia;
  registradoEmUtc: string;
  operadorId: string;
  sha256Custodia?: string | null;
  detalhe?: string | null;
}): void {
  conexao().prepare(`
    INSERT INTO custodia_eventos (
      ocorrencia_id, etapa, registrado_em_utc, operador_id, sha256_custodia, detalhe
    ) VALUES (
      @ocorrenciaId, @etapa, @registradoEmUtc, @operadorId, @sha256Custodia, @detalhe
    )
  `).run({
    ocorrenciaId: params.ocorrenciaId,
    etapa: params.etapa,
    registradoEmUtc: params.registradoEmUtc,
    operadorId: params.operadorId,
    sha256Custodia: params.sha256Custodia ?? null,
    detalhe: params.detalhe ?? null
  });
}

export function listarEventosCustodia(ocorrenciaId: string): EventoCustodia[] {
  const linhas = conexao().prepare(`
    SELECT id, ocorrencia_id, etapa, registrado_em_utc, operador_id, sha256_custodia, detalhe
      FROM custodia_eventos
     WHERE ocorrencia_id = ?
     ORDER BY id ASC
  `).all(ocorrenciaId) as Array<{
    id: number;
    ocorrencia_id: string;
    etapa: string;
    registrado_em_utc: string;
    operador_id: string;
    sha256_custodia: string | null;
    detalhe: string | null;
  }>;

  return linhas.map(l => ({
    id: l.id,
    ocorrenciaId: l.ocorrencia_id,
    etapa: l.etapa as EtapaCustodia,
    registradoEmUtc: l.registrado_em_utc,
    operadorId: l.operador_id,
    sha256Custodia: l.sha256_custodia,
    detalhe: l.detalhe
  }));
}

// -------------------------------------------------------------
// DIAGNÓSTICO
// -------------------------------------------------------------

export function diagnosticarBanco(): {
  operacional: boolean;
  caminho: string;
  esquemaVersao: number;
  totalOcorrencias: number;
  totalEventosCustodia: number;
  erro?: string;
} {
  const caminho = resolverCaminhoBanco();
  try {
    const c = conexao();
    c.prepare('SELECT 1').get();
    const eventos = c.prepare('SELECT COUNT(*) AS total FROM custodia_eventos').get() as { total: number };
    return {
      operacional: true,
      caminho,
      esquemaVersao: c.pragma('user_version', { simple: true }) as number,
      totalOcorrencias: contarOcorrencias(),
      totalEventosCustodia: eventos.total
    };
  } catch (err: any) {
    return {
      operacional: false,
      caminho,
      esquemaVersao: -1,
      totalOcorrencias: -1,
      totalEventosCustodia: -1,
      erro: err.message
    };
  }
}

export function fecharBanco(): void {
  if (db) {
    db.close();
    db = null;
  }
}
