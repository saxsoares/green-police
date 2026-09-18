---
description: Integra uma nova fonte de dados governamental de ponta a ponta (tipos, proxy, cliente, catálogo, view)
argument-hint: "<órgão/sistema e o que fornece, ex: SICAR - imóveis rurais por coordenada>"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, WebFetch, WebSearch, Skill, Task
---

Integre uma nova fonte governamental ao SIMIA-Verde.

Fonte solicitada: $ARGUMENTS

Carregue a skill `conector-gov-br` e siga o procedimento de cinco pontos que ela define.

## Antes de escrever código

1. Localize a documentação real do endpoint (Swagger, portal de dados abertos, docs do órgão). Se não
   encontrar, faça uma requisição exploratória e inspecione a resposta real — **não presuma o schema**.
2. Determine: autenticação exigida, limites de taxa, cobertura geográfica (nacional? só uma UF?),
   latência típica, formato (JSON, CSV, GeoJSON, WFS/XML).
3. Responda explicitamente: **que pergunta investigativa ou tática esta fonte responde?** Se não
   houver resposta clara, a fonte não entra — cada conector é superfície de falha a mais.

Se o usuário não indicou como a fonte deve ser usada (enriquecer o dossiê automaticamente vs. consulta
exploratória do operador), pergunte antes de implementar — a decisão muda onde o código entra.

## Implementação

Os cinco pontos, na ordem:

1. tipos em [src/types.ts](src/types.ts)
2. rota proxy em [server.ts](server.ts) — `AbortController` 9 s, `User-Agent: SIMIA-Verde-SENASP/1.0`,
   validação de shape, erro que sinaliza erro
3. função cliente em [apiConnectors.ts](src/services/apiConnectors.ts) — `catch` devolve
   `sucesso: false`, jamais dado sintético
4. entrada em `CATALOGO_APIS_PUBLICAS`, com `beneficioPolicial` preenchido de verdade
5. consumo: etapa numerada em `processarOcorrencia()` (se enriquece o dossiê) ou view (se é consulta)

Se o dado aparecer no laudo, adicione a linha em [reportRenderer.ts](src/services/reportRenderer.ts)
**com a coluna de confiabilidade**.

## Verificação

```bash
npm run lint
npm run dev   # em background
curl "http://localhost:3000/api/<nova-rota>?..."
```

Teste os dois caminhos:
- **sucesso** — shape correto, `confiabilidade: 'REAL'`, `fonte` e `dataConsultaUtc` preenchidos;
- **falha** — aponte para host inválido e confirme que a UI mostra `INDISPONIVEL` com observação
  acionável, sem nenhum valor inventado.

Feche chamando o agente `auditor-integridade-dados` sobre os arquivos que você tocou.

## Se a cobertura for parcial

Fonte que cobre só uma UF (como o DATAGEO, restrito a SP) precisa declarar isso na `descricao` do
catálogo, e fora da cobertura retornar `INDISPONIVEL` **com observação explicando** — nunca vazio
silencioso. O operador não pode confundir "não há registro" com "esta base não cobre esta UF".
