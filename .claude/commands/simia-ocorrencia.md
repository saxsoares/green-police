---
description: Simula o fluxo operacional completo de uma ocorrência contra as APIs reais, validando cada camada
argument-hint: "<lat,lng> [UF] — ex: -21.1767,-47.8208 SP"
allowed-tools: Read, Grep, Glob, Bash, Task
---

Execute o fluxo operacional completo do SIMIA-Verde contra as APIs reais e valide cada camada. Serve
para verificar que o sistema funciona de ponta a ponta com dado vivo, não só que compila.

Coordenada e UF: $ARGUMENTS
(Se vazio, use `-21.1767,-47.8208 SP` — Ribeirão Preto/SP, com cobertura DATAGEO.)

## Procedimento

Confirme que `npm run dev` está ativo em `localhost:3000`. Se não estiver, pergunte antes de subir.

Percorra as 9 etapas de `processarOcorrencia()` em [analyzer.ts](src/services/analyzer.ts),
verificando o retorno real de cada uma:

| # | Etapa | Rota | O que validar |
|---|---|---|---|
| 1 | Meteorologia | `/api/meteo` | vento, UR, temperatura e pressão presentes e plausíveis para a região e a estação do ano |
| 2 | Focos orbitais | `/api/focos-inpe` | focos retornados; filtro de 35 km funcionando; ausência de foco declarada corretamente |
| 3 | Hidrografia e vias | `/api/osm-overpass` | feições nomeadas; comportamento quando o Overpass limita a taxa |
| 4 | AIA / SIGAMgeo | `/api/sigamgeo-wfs` | responde em SP; retorna `INDISPONIVEL` explicado fora de SP |
| 5 | Contexto ambiental | — | cada `ItemContexto` com `fonte`, `confiabilidade` e `dataConsultaUtc` corretos |
| 6 | Propagação | — | azimute = vento + 180°; área T+6h ≈ 36× T+1h; `ressalvaForense` presente |
| 7 | Diretrizes | — | usam as feições reais da etapa 3; declaram ausência quando não há |
| 8 | Instrução forense | — | tipificações condicionadas ao fato; `ressalvaPreliminaridade` íntegra |
| 9 | Cadeia de custódia | — | string canônica na ordem correta; SHA-256 de 64 hex maiúsculos |

Teste também a coordenada fora da cobertura DATAGEO (ex.: `-15.60,-56.10` em MT) e confirme que a
camada AIA retorna `INDISPONIVEL` **com observação**, não vazio silencioso.

## Verificação de custódia

Reproduza o hash de forma independente:

```bash
printf '%s' "<string canônica exata>" | sha256sum | tr 'a-f' 'A-F'
```

Deve bater exatamente com o `sha256Hex` do bloco. Se não bater, há bug em `buildCanonicalString` ou
em `calculateSha256` — achado crítico.

## Relatório

Para cada etapa: OK / degradada / falhou, com o dado real observado.

Depois, especificamente: **alguma camada indisponível foi preenchida com valor plausível em vez de
ser declarada como indisponível?** Essa é a pergunta que mais importa. Se a resposta for sim, é
achado crítico — acione o agente `auditor-integridade-dados` sobre o trecho responsável.
