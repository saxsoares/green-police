export const meta = {
  name: 'auditoria-conectores',
  description: 'Audita cada conector governamental de ponta a ponta: proxy, cliente, tratamento de falha e catálogo',
  whenToUse: 'Quando um órgão muda schema ou endpoint, ao investigar dado estranho no dossiê, ou periodicamente para confirmar que toda fonte externa trata falha declarando INDISPONIVEL em vez de inventar valor.',
  phases: [
    { title: 'Auditar', detail: 'um agente por conector: rota, cliente, falha, catálogo' },
    { title: 'Consolidar', detail: 'mapa de saúde e riscos sistêmicos' },
  ],
}

const REGRA_DE_OURO = `
REGRA DE OURO: o SIMIA-Verde produz laudo pericial. Conector que, em falha, devolve valor plausível
em vez de sinalizar indisponibilidade introduz prova falsa em processo criminal. O caminho correto é
sempre: falha da fonte -> sucesso:false no cliente -> confiabilidade 'INDISPONIVEL' com observacoes
acionáveis na UI e no laudo.
`

const CONECTORES = [
  { key: 'open-meteo', orgao: 'Open-Meteo / ERA5', rota: '/api/meteo', critico: true, nota: 'Alimenta diretamente o modelo de propagação. Vento e UR errados corrompem toda a etapa 6.' },
  { key: 'inpe', orgao: 'INPE BDQueimadas / MCTI', rota: '/api/focos-inpe', critico: true, nota: 'Tem dois caminhos: endpoint de API e arquivo GeoJSON br_<uf>_24h.json. Ambos precisam funcionar.' },
  { key: 'nasa-firms', orgao: 'NASA LANCE / EOSDIS', rota: '/api/focos-nasa', critico: false, nota: 'Responde CSV, não JSON. Requer MAP_KEY. Cota esgotada retorna texto de erro com HTTP 200.' },
  { key: 'nasa-status', orgao: 'NASA FIRMS mapkey_status', rota: '/api/satellites/status', critico: false, nota: 'Telemetria de cota. Verificar se a chave é mascarada em todo log e resposta.' },
  { key: 'sipam-eventos', orgao: 'CENSIPAM / Ministério da Defesa', rota: '/api/sipam/eventos', critico: true, nota: 'Janela máxima de 30 dias é limite regulamentar, não técnico. Cache de 60s em sipamCache.' },
  { key: 'sipam-focos', orgao: 'CENSIPAM', rota: '/api/sipam/focos', critico: false, nota: 'Janela em horas, por fonte de origem.' },
  { key: 'sipam-detalhes', orgao: 'CENSIPAM', rota: '/api/sipam/evento-detalhes/:id', critico: true, nota: 'Traz imóveis CAR — base da intimação do proprietário. Verificar anonimização LGPD.' },
  { key: 'sipam-posicao', orgao: 'CENSIPAM', rota: '/api/sipam/evento-posicao', critico: false, nota: 'Busca de evento por lat/lng.' },
  { key: 'sipam-status', orgao: 'CENSIPAM', rota: '/api/sipam/status', critico: false, nota: 'Health check via diagnosticos/ping.' },
  { key: 'overpass', orgao: 'OpenStreetMap Overpass', rota: '/api/osm-overpass', critico: true, nota: 'Alimenta as feições reais das diretrizes táticas. Rate limit agressivo; exige User-Agent.' },
  { key: 'ibge', orgao: 'IBGE / BrasilAPI', rota: '/api/ibge-estados, /api/ibge-municipios', critico: true, nota: 'Define comarca no laudo. Tem fallback BrasilAPI e cache em memória.' },
  { key: 'datageo', orgao: 'DATAGEO / SIGAMgeo SP', rota: '/api/sigamgeo-wfs', critico: true, nota: 'COBRE APENAS SÃO PAULO. Fora de SP deve retornar INDISPONIVEL explicado, nunca vazio silencioso.' },
]

const SCHEMA = {
  type: 'object',
  properties: {
    conector: { type: 'string' },
    saude: { type: 'string', enum: ['ok', 'fragil', 'quebrado'] },
    rotaExiste: { type: 'boolean' },
    temTimeout: { type: 'boolean', description: 'AbortController com timeout na rota do server.ts' },
    temUserAgent: { type: 'boolean', description: 'User-Agent SIMIA-Verde-SENASP identificável' },
    validaShape: { type: 'boolean', description: 'Valida o formato da resposta, não apenas o status HTTP' },
    falhaSinalizaFalha: { type: 'boolean', description: 'CRÍTICO: em erro devolve falha, sem dado sintético nem default plausível' },
    clienteTrataErro: { type: 'boolean', description: 'A função em apiConnectors.ts devolve sucesso:false sem inventar dado' },
    noCatalogo: { type: 'boolean', description: 'Tem entrada em CATALOGO_APIS_PUBLICAS com beneficioPolicial preenchido' },
    credencialIsolada: { type: 'boolean', description: 'Nenhuma chave alcançável pelo bundle do navegador; mascarada em logs' },
    problemas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          descricao: { type: 'string' },
          arquivo: { type: 'string' },
          linha: { type: 'number' },
          gravidade: { type: 'string', enum: ['critico', 'grave', 'medio', 'baixo'] },
          correcao: { type: 'string' },
        },
        required: ['descricao', 'arquivo', 'gravidade', 'correcao'],
      },
    },
  },
  required: ['conector', 'saude', 'rotaExiste', 'falhaSinalizaFalha', 'clienteTrataErro', 'noCatalogo', 'problemas'],
}

phase('Auditar')

const auditorias = await parallel(
  CONECTORES.map((c) => () =>
    agent(`${REGRA_DE_OURO}

Audite o conector "${c.key}" (${c.orgao}) do SIMIA-Verde, rota ${c.rota}.
${c.critico ? 'ESTE CONECTOR É CRÍTICO PARA O DOSSIÊ PERICIAL.' : ''}
Contexto conhecido: ${c.nota}

Leia o código real:
1. A rota em server.ts — AbortController com timeout, User-Agent identificável, validação de SHAPE
   (não só de status HTTP: órgão gov.br devolve HTML de erro com HTTP 200), e o que ela retorna em
   caso de falha.
2. A função cliente correspondente em src/services/apiConnectors.ts — o que o catch devolve.
3. A entrada em CATALOGO_APIS_PUBLICAS — existe? beneficioPolicial está preenchido de verdade?
4. Onde o dado é consumido (analyzer.ts ou uma view) — a falha vira confiabilidade 'INDISPONIVEL'
   com observacoes acionáveis, ou vira valor plausível / vazio silencioso?
5. Credenciais: alguma chave alcança o bundle do navegador? Aparece sem máscara em log ou resposta?

O campo mais importante do seu retorno é falhaSinalizaFalha. Só marque true se você verificou, lendo
o código, que TODOS os caminhos de erro dessa rota sinalizam erro. Na dúvida, false.`, {
      label: `auditar:${c.key}`,
      phase: 'Auditar',
      schema: SCHEMA,
    })
  )
)

const validas = auditorias.filter(Boolean)
if (validas.length < CONECTORES.length) {
  log(`ATENCAO: ${CONECTORES.length - validas.length} de ${CONECTORES.length} auditorias nao retornaram — cobertura incompleta`)
}

const fabricam = validas.filter((a) => !a.falhaSinalizaFalha || !a.clienteTrataErro)
const quebrados = validas.filter((a) => a.saude === 'quebrado')
log(`${validas.length} conectores auditados — ${quebrados.length} quebrados, ${fabricam.length} com risco de fabricar dado`)

phase('Consolidar')

const consolidado = await agent(`${REGRA_DE_OURO}

Consolide a auditoria dos conectores governamentais do SIMIA-Verde.

RESULTADOS (JSON):
${JSON.stringify(validas, null, 2)}

${validas.length < CONECTORES.length ? `AVISO: ${CONECTORES.length - validas.length} conector(es) não foram auditados — declare essa lacuna no relatório.` : ''}

Produza:

1. MAPA DE SAÚDE — tabela: conector | órgão | saúde | falha sinaliza falha? | no catálogo? | crítico?

2. RISCO DE FABRICAÇÃO DE DADO — a seção mais importante. Liste todo conector cuja falha pode virar
   valor plausível no dossiê, com arquivo:linha e a correção. Se a lista estiver vazia, diga isso
   explicitamente — é a melhor notícia possível neste projeto.

3. FRAGILIDADES ESTRUTURAIS — timeout ausente, shape não validado, User-Agent faltando, credencial
   exposta, conector fora do catálogo.

4. PADRÕES SISTÊMICOS — o mesmo defeito em vários conectores pede correção de padrão (um helper
   compartilhado de proxy, por exemplo), não N correções pontuais. Se identificar isso, proponha o
   helper.

5. PRIORIDADE — ordem de correção, com conectores críticos para o dossiê à frente.

Interprete os dados; não os repita.`, {
  label: 'consolidacao',
  phase: 'Consolidar',
})

return {
  auditados: validas.length,
  total: CONECTORES.length,
  quebrados: quebrados.map((a) => a.conector),
  riscoDeFabricacao: fabricam.map((a) => a.conector),
  detalhes: validas,
  relatorio: consolidado,
}
