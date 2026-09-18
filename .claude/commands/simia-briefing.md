---
description: Briefing do projeto para quem está chegando — desenvolvedor, perito, delegado ou gestor
argument-hint: "[público: dev | perito | delegado | gestor | bombeiro]"
allowed-tools: Read, Grep, Glob, Bash
---

Produza um briefing do SIMIA-Verde ajustado ao público.

Público: $ARGUMENTS
(Se vazio, pergunte ao usuário para quem é antes de escrever — o mesmo conteúdo serve mal a
desenvolvedor e a delegado.)

Leia [README.md](README.md), [CLAUDE.md](CLAUDE.md), [src/types.ts](src/types.ts) e
[src/App.tsx](src/App.tsx). Confirme o estado atual do código antes de descrever qualquer coisa — o
README pode estar à frente ou atrás da implementação, e o briefing precisa descrever o que existe.

## Ajuste por público

**dev** — arquitetura (React 19 + Vite + Express proxy), fluxo de `processarOcorrencia()`, os cinco
pontos de um conector, a regra de ouro de não fabricar dado e por que ela é inegociável, comandos
(`npm run dev` / `lint` / `build`), ausência de testes e o que isso implica, e os arquivos sensíveis
(`crypto.ts`, `reportRenderer.ts`, tipificações). Termine com "por onde começar a mexer".

**perito** — fluxo operacional das 8 abas, tríplice validação SIPAM × INPE × NASA e o que cada fonte
sustenta, estrutura do laudo P4, cadeia de custódia SHA-256 e como usar o validador, o que o sistema
**não** prova (autoria), e como interpretar `REAL` / `SIMULADO` / `INDISPONIVEL`.

**delegado** — o que o sistema entrega para instruir inquérito: materialidade por convergência
orbital, identificação do imóvel CAR para intimação, indícios de dolo e seu lastro, tipificação
preliminar (e por que é preliminar), quesitos periciais, e os limites probatórios de cada fonte.

**gestor** — finalidade institucional, órgãos e bases integradas, conformidade (SENASP/MJSP, Lei
9.605/98, CPP 158-A, LGPD), estado de maturidade real do sistema, dependências externas e seus riscos
(APIs governamentais caem), e lacunas conhecidas.

**bombeiro** — leitura do mapa tático e da rosa dos ventos, modelagem elíptica e seus limites,
diretrizes de combate, back-tracking do ponto de ignição, e a advertência de que projeção é modelo e
não substitui reconhecimento em campo.

## Forma

Comece nomeando o público ("Escrito para: ..."). Seja concreto: referencie arquivos com caminho
clicável para dev; para os demais, referencie **abas e telas**, não arquivos. Use o vocabulário do
público — não explique `useEffect` a um delegado nem "vértice em V" a um desenvolvedor sem definir.

Feche com as limitações honestas do sistema para aquele público. Um briefing que só vende a
ferramenta é inútil para quem vai depender dela numa ocorrência real.
