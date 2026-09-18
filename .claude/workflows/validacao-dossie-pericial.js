export const meta = {
  name: 'validacao-dossie-pericial',
  description: 'Valida o dossiê pericial sob os olhares que ele vai enfrentar: perito, delegado, promotor, defesa e juiz',
  whenToUse: 'Antes de usar o laudo P4 em ocorrência real, ou após alterar reportRenderer.ts, crypto.ts ou as tipificações. Cada papel processual examina a peça pelo seu próprio interesse; a síntese responde se o dossiê sustenta denúncia.',
  phases: [
    { title: 'Examinar', detail: 'cinco papéis processuais, em paralelo' },
    { title: 'Confrontar', detail: 'as objeções da Defesa contra as demais leituras' },
    { title: 'Parecer', detail: 'veredito de sustentação processual' },
  ],
}

const CONTEXTO = `
SIMIA-Verde: sistema da SENASP/MJSP que produz dossiê pericial de queimadas a partir de dados
orbitais (SIPAM/CENSIPAM, INPE BDQueimadas, NASA FIRMS), meteorologia (Open-Meteo), base fundiária
(CAR), autuações ambientais (SIGAMgeo-SP) e modelagem física de propagação (Rothermel/Alexander).

Peças a examinar:
- src/services/reportRenderer.ts — o laudo P4 em Markdown (7 seções)
- src/services/analyzer.ts — as 9 etapas de processamento, incluindo tese de dolo e tipificações
- src/services/crypto.ts — cadeia de custódia SHA-256 (CPP 158-A a 158-F)
- src/services/geoCalculations.ts — modelagem de propagação
- src/components/views/ReportView.tsx e CustodyView.tsx — apresentação e validador

Princípio do projeto: nenhum dado fabricado. Consulta que falha vira 'INDISPONIVEL', nunca um valor
plausível. Satélite prova materialidade (houve fogo, onde, quando); não prova autoria.
`

const PAPEIS = [
  {
    key: 'perito',
    agentType: 'perito-forense',
    prompt: `Você é o PERITO CRIMINAL OFICIAL que assina este laudo. Sua responsabilidade é pessoal e
funcional. Examine: a estrutura das 7 seções está completa e na ordem? Cada afirmação tem fonte e
data de consulta? Coordenadas com 6 decimais e datum? Horários em UTC? Estimativas enunciadas no
condicional com a ressalva do modelo? A cadeia de custódia é reproduzível por terceiro independente?
Você assinaria esta peça como está?`,
  },
  {
    key: 'delegado',
    prompt: `Você é o DELEGADO DE POLÍCIA presidindo o inquérito. Você precisa decidir diligências e,
ao final, indiciar ou não. Examine: o dossiê estabelece materialidade de forma suficiente? Identifica
o imóvel CAR e permite intimar o proprietário? Os indícios de autoria são utilizáveis ou são
inferência do sistema? Os quesitos periciais cobrem o que você precisa perguntar? O que falta para
você despachar? O sistema em algum ponto conclui por você o que cabe a você concluir?`,
  },
  {
    key: 'promotor',
    prompt: `Você é o PROMOTOR DE JUSTIÇA avaliando se oferece denúncia. Examine: há justa causa —
materialidade demonstrada e indícios suficientes de autoria? A tipificação proposta se sustenta nos
fatos apurados, ou é excesso acusatório que será rejeitado? A convergência SIPAM x INPE x NASA está
demonstrada ou apenas afirmada? A distinção entre dolo e culpa tem lastro fático explícito? Que prova
adicional você exigiria antes de denunciar?`,
  },
  {
    key: 'defesa',
    prompt: `Você é o ADVOGADO DE DEFESA e seu trabalho é DESTRUIR esta peça. Procure, sem
complacência: vício de cadeia de custódia; coordenada sem datum; horário sem fuso; afirmação sem
fonte; estimativa de modelo apresentada como constatação; salto de materialidade para autoria; dado
marcado INDISPONIVEL que virou afirmação categórica no texto; tipificação não condicionada aos fatos;
coeficiente de modelo sem proveniência científica; conclusão que extrapola o que os dados sustentam.
Seja agressivo e específico: cada achado é uma tese de nulidade ou de absolvição. Cite arquivo e
linha.`,
  },
  {
    key: 'juiz',
    prompt: `Você é o JUIZ que vai receber ou rejeitar a denúncia e, depois, valorar esta prova.
Examine: a peça é compreensível para quem não é perito? A metodologia está descrita a ponto de ser
controlável? Fica claro o que é medição, o que é modelo e o que não pôde ser verificado? A cadeia de
custódia permite aferir que o documento não foi adulterado? Que peso probatório você atribuiria a
esta peça, e o que faria você atribuir mais?`,
  },
]

const SCHEMA_EXAME = {
  type: 'object',
  properties: {
    papel: { type: 'string' },
    vereditoDoP: { type: 'string', description: 'Parecer do papel em uma frase' },
    pontos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questao: { type: 'string', description: 'O problema, na perspectiva deste papel' },
          arquivo: { type: 'string' },
          linha: { type: 'number' },
          gravidade: { type: 'string', enum: ['fatal', 'grave', 'relevante', 'menor'] },
          consequencia: { type: 'string', description: 'O que acontece processualmente se não for corrigido' },
          correcao: { type: 'string' },
        },
        required: ['questao', 'arquivo', 'gravidade', 'consequencia', 'correcao'],
      },
    },
    forcas: { type: 'array', items: { type: 'string' }, description: 'O que a peça já faz bem, nesta perspectiva' },
  },
  required: ['papel', 'vereditoDoP', 'pontos', 'forcas'],
}

phase('Examinar')

const exames = await parallel(
  PAPEIS.map((p) => () =>
    agent(`${CONTEXTO}\n\n${p.prompt}\n\nLeia o código real antes de opinar. Cite arquivo e linha em cada ponto. Não invente defeitos: se a peça está sólida na sua perspectiva, diga isso e registre as forças.`, {
      label: `exame:${p.key}`,
      phase: 'Examinar',
      agentType: p.agentType,
      schema: SCHEMA_EXAME,
    }).then((r) => (r ? { ...r, key: p.key } : null))
  )
)

// Ancorar pela chave do papel, não pelo campo `papel` (preenchido pelo agente) nem por índice —
// um exame que falha desloca os índices e trocaria a Defesa por outro papel.
const validos = exames.filter(Boolean)
const defesa = validos.find((e) => e.key === 'defesa')
const objecoesDefesa = defesa ? defesa.pontos : []
if (!defesa) log('ATENCAO: o exame da Defesa nao retornou — a fase de confronto sera ignorada')

log(`${validos.length}/${PAPEIS.length} exames concluidos — ${objecoesDefesa.length} objecoes da Defesa a confrontar`)

phase('Confrontar')

// Cada objeção da Defesa é confrontada contra o que os demais papéis viram: ela procede,
// ou já existe no sistema algo que a neutraliza?
const SCHEMA_CONFRONTO = {
  type: 'object',
  properties: {
    procede: { type: 'boolean' },
    neutralizavel: { type: 'boolean', description: 'true se já existe salvaguarda no sistema, ou se correção simples resolve' },
    analise: { type: 'string' },
    acaoRecomendada: { type: 'string' },
  },
  required: ['procede', 'neutralizavel', 'analise', 'acaoRecomendada'],
}

const confrontos = objecoesDefesa.length
  ? await parallel(
      objecoesDefesa.map((o) => () =>
        agent(`${CONTEXTO}

A Defesa levantou esta objeção contra o dossiê pericial do SIMIA-Verde:

Questão: ${o.questao}
Local: ${o.arquivo}${o.linha ? ':' + o.linha : ''}
Gravidade alegada: ${o.gravidade}
Consequência alegada: ${o.consequencia}

Confronte com o código real e com o que os demais papéis processuais observaram:

PARECERES DOS DEMAIS PAPÉIS:
${JSON.stringify(validos.filter((e) => e.key !== 'defesa').map((e) => ({ papel: e.key, veredito: e.vereditoDoP, forcas: e.forcas })), null, 2)}

A objeção procede contra o sistema como ele está hoje? Já existe salvaguarda (ressalva, selo de
confiabilidade, condicionamento fático, validador de custódia) que a neutraliza? Se procede, a
correção é simples ou estrutural?

Seja honesto nos dois sentidos: não descarte objeção real para proteger o sistema, nem valide
objeção retórica que o código já responde.`, {
          label: `confronto:${(o.arquivo || 'geral').split(/[\\/]/).pop()}`,
          phase: 'Confrontar',
          schema: SCHEMA_CONFRONTO,
        }).then((c) => (c ? { objecao: o, ...c } : null))
      )
    )
  : []

const procedentes = confrontos.filter(Boolean).filter((c) => c.procede)
log(`${procedentes.length} de ${objecoesDefesa.length} objecoes da Defesa procedem`)

phase('Parecer')

const parecer = await agent(`${CONTEXTO}

Você recebeu o exame do dossiê pericial do SIMIA-Verde por cinco papéis processuais, e o confronto
das objeções da Defesa contra as demais leituras. Produza o parecer final para a equipe do projeto.

EXAMES POR PAPEL:
${JSON.stringify(validos, null, 2)}

CONFRONTO DAS OBJEÇÕES DA DEFESA:
${JSON.stringify(confrontos.filter(Boolean), null, 2)}

Estruture:

1. VEREDITO em uma linha: o dossiê SUSTENTA DENÚNCIA / SUSTENTA COM CORREÇÕES / NÃO SUSTENTA.

2. VÍCIOS FATAIS — o que, se não corrigido, derruba a peça em juízo. Arquivo:linha e correção.
   Vício de cadeia de custódia e dado fabricado que chega ao laudo são sempre fatais.

3. OBJEÇÕES DA DEFESA QUE PROCEDEM — em ordem de gravidade, com a ação recomendada.

4. LACUNAS POR PAPEL — o que cada um (perito, delegado, promotor, juiz) disse que falta.

5. FORÇAS — o que a peça já faz bem e deve ser preservado em qualquer refatoração. Seja específico:
   isso protege contra alguém remover uma salvaguarda achando que é verbosidade.

6. PLANO DE CORREÇÃO — sequência, do que bloqueia uso operacional ao que é melhoria incremental.

Interprete; não repita o JSON. Se o dossiê estiver processualmente sólido, diga isso com clareza.`, {
  label: 'parecer-final',
  phase: 'Parecer',
})

return {
  examesConcluidos: validos.length,
  objecoesDefesa: objecoesDefesa.length,
  objecoesProcedentes: procedentes.length,
  pareceresPorPapel: validos.map((e) => ({ papel: e.key, veredito: e.vereditoDoP, pontos: e.pontos.length })),
  detalhes: { exames: validos, confrontos: confrontos.filter(Boolean) },
  parecer,
}
