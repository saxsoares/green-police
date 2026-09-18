---
description: Revisão pericial e jurídica do laudo P4 e da cadeia de custódia
argument-hint: "[seção ou arquivo opcional]"
allowed-tools: Read, Grep, Glob, Bash, Task, WebSearch, WebFetch
---

Revise a peça pericial produzida pelo SIMIA-Verde quanto a validade, admissibilidade e correção
jurídica.

Alvo: $ARGUMENTS
(Se vazio, revise [reportRenderer.ts](src/services/reportRenderer.ts),
[crypto.ts](src/services/crypto.ts) e as seções de `InstrucaoForense` e `BlocoCustodia` em
[analyzer.ts](src/services/analyzer.ts).)

## Procedimento

Dispare em paralelo, numa única mensagem, dois agentes:

- `perito-forense` — estrutura do laudo P4, redação pericial, cadeia de custódia SHA-256 (CPP
  158-A a 158-F), distinção materialidade × autoria, preservação da confiabilidade até o texto final.
- `analista-juridico-ambiental` — conferência de diploma, artigo, conduta e pena; condicionamento
  fático das tipificações; lastro da tese de dolo/culpa; ressalva de preliminaridade; competência
  (UC federal / TI → Justiça Federal).

Enquanto eles trabalham, verifique você mesmo:

1. Todas as 7 seções do laudo estão presentes e na ordem (ver skill `laudo-pericial-p4`).
2. Coordenadas com 6 casas decimais e datum declarado.
3. Horários rotulados como UTC.
4. A tabela de contexto ambiental mantém a **coluna de confiabilidade por camada**.
5. Estimativas de propagação usam verbo condicional e vêm com a `ressalvaForense`.
6. `ressalvaPreliminaridade` presente e íntegra.
7. A string canônica de custódia preserva ordem, separador ` | ` e `trim()`.

## Relatório

Consolide sem duplicar. Para cada problema:

- seção do laudo afetada
- vício gerado (pericial, processual ou jurídico)
- **como a Defesa exploraria** — este é o teste que importa
- redação corrigida, pronta para aplicar

Encerre com veredito: **laudo apto** ou **laudo com vício**, e neste caso os itens bloqueantes.

Atenção especial: qualquer alteração proposta na string canônica de `buildCanonicalString()` invalida
retroativamente todos os laudos já emitidos. Se alguma correção exigir isso, sinalize em destaque e
proponha o caminho de versionamento em vez da mudança direta.
