export const meta = {
  name: 'revisao-forense-completa',
  description: 'Revisão multi-dimensional do SIMIA-Verde com verificação adversarial de cada achado',
  whenToUse: 'Antes de liberar o sistema para uso operacional, ou após alterações amplas em services/, server.ts ou nas views. Cobre integridade pericial, laudo, direito, doutrina tática, geodésia e frontend, e verifica cada achado por refutação antes de reportar.',
  phases: [
    { title: 'Revisar', detail: 'um revisor por dimensão, em paralelo' },
    { title: 'Verificar', detail: 'refutação adversarial de cada achado' },
    { title: 'Sintetizar', detail: 'consolidação e veredito de aptidão' },
  ],
}

const REGRA_DE_OURO = `
REGRA DE OURO DO PROJETO: o SIMIA-Verde produz laudo pericial que instrui processo criminal.
Dado fabricado aqui é prova falsa. Nunca aceite mock, fallback plausível, default numérico sem
proveniência, ou 'confiabilidade: REAL' em campo cuja origem não seja resposta de API efetivamente
recebida. O resultado correto para consulta que falhou é 'INDISPONIVEL' com observacoes acionáveis.
`

const DIMENSOES = [
  {
    key: 'integridade',
    agentType: 'auditor-integridade-dados',
    peso: 'critico',
    prompt: `Audite TODO o src/ e o server.ts do SIMIA-Verde procurando dado fabricado, fallback
plausível, rótulo de confiabilidade mentiroso e ressalva obrigatória removida ou enfraquecida.
Leia cada catch, cada ?? e cada || que toque campo de medição. Rastreie de analyzer.ts até
reportRenderer.ts se a incerteza sobrevive até o texto do laudo.`,
  },
  {
    key: 'laudo',
    agentType: 'perito-forense',
    peso: 'critico',
    prompt: `Revise src/services/reportRenderer.ts, src/services/crypto.ts, ReportView.tsx e
CustodyView.tsx. Verifique estrutura das 7 seções do laudo P4, redação pericial (datum, UTC, fonte
por afirmação, condicional para estimativa, materialidade x autoria) e a cadeia de custódia conforme
CPP 158-A a 158-F. Aponte o que a Defesa exploraria.`,
  },
  {
    key: 'juridico',
    agentType: 'analista-juridico-ambiental',
    peso: 'alto',
    prompt: `Revise todas as tipificações penais e administrativas e a tese de dolo/culpa em
src/services/analyzer.ts (etapa 8), e qualquer texto jurídico nas views. Confira diploma, artigo,
conduta e pena contra a lei vigente. Verifique se cada tipificação está condicionada ao fato apurado
e se a ressalva de preliminaridade está íntegra. Aponte também tipificações faltantes.`,
  },
  {
    key: 'doutrina',
    agentType: 'doutrina-operacional',
    peso: 'alto',
    prompt: `Revise as DiretrizesTaticas em src/services/analyzer.ts (etapa 7) e
DirectivesView.tsx. Avalie especificidade operacional, segurança da guarnição (LCES), coerência com
meteo e projecao da mesma ocorrência, e preservação de vestígio. Priorize achados com potencial de
dano físico a equipe em campo.`,
  },
  {
    key: 'geodesia',
    agentType: 'geoanalista-propagacao',
    peso: 'alto',
    prompt: `Revise src/services/geoCalculations.ts e TacticalMapView.tsx. Verifique a inversão do
azimute de vento (propagação = vento + 180), conversões WGS84/UTM, sanidade dimensional das elipses
(área T+6h ~ 36x T+1h), casos-limite (vento 0, UR 100%, fusos UTM 18-25 S), proveniência citada de
cada coeficiente do modelo, validade do GeoJSON e a troca [lat,lng] x [lng,lat] entre Leaflet e
GeoJSON. Confirme que ressalvaForense acompanha toda saída de modelFireSpread.`,
  },
  {
    key: 'frontend',
    agentType: 'frontend-tatico',
    peso: 'medio',
    prompt: `Revise src/App.tsx, Sidebar.tsx, Header.tsx e src/components/views/*.tsx. Procure:
confiabilidade não exibida ou INDISPONIVEL escondido atrás de traço/vazio, ausência de estado de
carregamento em consulta a órgão, erro de API que só vai para console em vez de virar mensagem
acionável, vazamento de instância Leaflet em useEffect, listas de focos renderizadas sem limite, e
quebra do layout de impressão A4 do laudo.`,
  },
]

const SCHEMA_ACHADOS = {
  type: 'object',
  properties: {
    achados: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Uma frase afirmando o defeito' },
          arquivo: { type: 'string' },
          linha: { type: 'number' },
          trecho: { type: 'string', description: 'O código ou texto problemático' },
          gravidade: { type: 'string', enum: ['critico', 'grave', 'medio', 'baixo'] },
          risco: { type: 'string', description: 'Consequência processual, pericial ou operacional concreta' },
          correcao: { type: 'string', description: 'A correção proposta, concreta' },
        },
        required: ['titulo', 'arquivo', 'gravidade', 'risco', 'correcao'],
      },
    },
    verificado: { type: 'string', description: 'O que foi inspecionado e considerado correto' },
  },
  required: ['achados', 'verificado'],
}

const SCHEMA_VEREDITO = {
  type: 'object',
  properties: {
    refutado: { type: 'boolean', description: 'true se o achado NAO se sustenta' },
    justificativa: { type: 'string' },
    gravidadeCorrigida: { type: 'string', enum: ['critico', 'grave', 'medio', 'baixo'] },
  },
  required: ['refutado', 'justificativa'],
}

// Revisão e verificação em pipeline: cada dimensão verifica seus achados assim que termina,
// sem esperar as outras dimensões.
const resultados = await pipeline(
  DIMENSOES,

  (dim) =>
    agent(`${REGRA_DE_OURO}\n\n${dim.prompt}\n\nSeja específico: arquivo, linha, trecho. Não invente achados para parecer produtivo — um relatório vazio com "verificado" bem preenchido é um resultado válido.`, {
      label: `revisar:${dim.key}`,
      phase: 'Revisar',
      agentType: dim.agentType,
      schema: SCHEMA_ACHADOS,
    }),

  (revisao, dim) => {
    if (!revisao || !revisao.achados.length) return []
    return parallel(
      revisao.achados.map((a) => () =>
        agent(`${REGRA_DE_OURO}

Tente REFUTAR este achado de revisão do SIMIA-Verde. Leia o código real antes de decidir.

Dimensão: ${dim.key}
Achado: ${a.titulo}
Arquivo: ${a.arquivo}${a.linha ? ':' + a.linha : ''}
Trecho alegado: ${a.trecho || '(não informado)'}
Risco alegado: ${a.risco}

O achado se sustenta contra o código como ele está hoje? Considere: o trecho existe mesmo? O risco
descrito é real ou teórico? Já existe salvaguarda em outro ponto do fluxo que neutraliza o problema?
A gravidade atribuída é proporcional?

Na dúvida honesta, marque refutado=false e explique a incerteza — é pior descartar um defeito real
num laudo pericial do que carregar um achado a mais para revisão humana.`, {
          label: `verificar:${dim.key}:${a.arquivo.split(/[\\/]/).pop()}`,
          phase: 'Verificar',
          schema: SCHEMA_VEREDITO,
        }).then((v) => (v && !v.refutado ? { ...a, dimensao: dim.key, peso: dim.peso, gravidade: v.gravidadeCorrigida || a.gravidade, verificacao: v.justificativa } : null))
      )
    )
  }
)

const confirmados = resultados.flat().filter(Boolean)

const ORDEM = { critico: 0, grave: 1, medio: 2, baixo: 3 }
confirmados.sort((a, b) => ORDEM[a.gravidade] - ORDEM[b.gravidade])

const criticos = confirmados.filter((a) => a.gravidade === 'critico')
log(`${confirmados.length} achados confirmados apos verificacao adversarial — ${criticos.length} criticos`)

phase('Sintetizar')

const sintese = await agent(`${REGRA_DE_OURO}

Você recebeu os achados confirmados de uma revisão multi-dimensional do SIMIA-Verde, já filtrados por
verificação adversarial. Produza o relatório final para a equipe do projeto.

ACHADOS CONFIRMADOS (JSON):
${JSON.stringify(confirmados, null, 2)}

Estruture assim:

1. VEREDITO em uma linha: APTO PARA USO OPERACIONAL / APTO COM RESSALVAS / NÃO APTO.
   Regra de decisão: qualquer achado crítico de integridade de dados (dado fabricado que chega ao
   laudo) ou vício de cadeia de custódia torna o sistema NÃO APTO, independentemente do resto.

2. BLOQUEANTES — os críticos, cada um com arquivo:linha, risco processual e correção.

3. POR DIMENSÃO — agrupe os demais por dimensão (integridade, laudo, jurídico, doutrina, geodésia,
   frontend), em ordem de gravidade.

4. PADRÕES — defeitos que se repetem em mais de um arquivo ou dimensão e pedem correção sistêmica,
   não pontual.

5. ORDEM DE CORREÇÃO — sequência recomendada, considerando dependências entre correções.

Seja concreto e conciso. Não repita a lista JSON; interprete-a. Se não houver achado crítico, diga
isso com clareza em vez de inflar a gravidade do que sobrou.`, {
  label: 'sintese-final',
  phase: 'Sintetizar',
})

return {
  totalConfirmados: confirmados.length,
  criticos: criticos.length,
  porDimensao: DIMENSOES.map((d) => ({ dimensao: d.key, achados: confirmados.filter((a) => a.dimensao === d.key).length })),
  achados: confirmados,
  relatorio: sintese,
}
