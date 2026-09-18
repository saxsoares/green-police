---
description: Verificação completa antes de entregar ou publicar — tipos, build, integridade pericial, laudo e doutrina
allowed-tools: Read, Grep, Glob, Bash, Task
---

Execute a verificação de pré-entrega do SIMIA-Verde. Este é o portão antes de o sistema ser usado em
ocorrência real.

## Etapa 1 — Portões técnicos (sequencial, bloqueante)

```bash
npm run lint     # tsc --noEmit — único portão automatizado do repo
npm run build    # vite build + esbuild do server
```

Se qualquer um falhar, **pare aqui**, relate e corrija antes de seguir. Não há suíte de testes neste
projeto, então esses dois comandos são toda a rede de proteção automatizada.

## Etapa 2 — Revisões especializadas (paralelo)

Dispare numa única mensagem:

- `auditor-integridade-dados` — dado fabricado, fallback plausível, rótulo de confiabilidade
  mentiroso, ressalva removida. **Este é o veto absoluto.**
- `perito-forense` — laudo P4 e cadeia de custódia
- `analista-juridico-ambiental` — tipificações, penas, teses, preliminaridade
- `doutrina-operacional` — diretrizes táticas das três forças
- `geoanalista-propagacao` — azimutes, áreas, conversões UTM, sanidade dimensional do modelo

## Etapa 3 — Verificação manual

```bash
git status --short 2>/dev/null || echo "(sem repositório git)"
grep -rn "TODO\|FIXME\|XXX\|HACK" src/ server.ts
cat .env.example   # confira se toda variável nova está documentada
```

Confirme também que nenhuma credencial vazou para o bundle:

```bash
grep -rn "MAP_KEY\|API_KEY\|GEMINI" src/ | grep -v "^src/services/apiConnectors.ts"
```

Qualquer chave referenciada em `src/` (fora de repasse explícito pelo proxy) é vazamento.

## Relatório final

Uma tabela: `verificação | resultado | bloqueante?`

Depois o veredito:

- **APTO PARA USO OPERACIONAL** — nenhum achado bloqueante
- **APTO COM RESSALVAS** — liste as ressalvas que o operador precisa conhecer
- **NÃO APTO** — liste os bloqueantes em ordem de correção

Regra de decisão: qualquer achado **crítico** do `auditor-integridade-dados` (dado fabricado que
chega ao laudo) ou vício de cadeia de custódia do `perito-forense` torna o sistema **NÃO APTO**,
independentemente do resto estar verde. Não há negociação nesse ponto — é o que separa uma ferramenta
pericial de uma ferramenta que produz prova falsa.
