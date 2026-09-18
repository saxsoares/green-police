---
description: Auditoria de integridade pericial — caça dado fabricado, fallback plausível e rótulo de confiabilidade mentiroso
argument-hint: "[caminho ou escopo opcional, ex: src/services ou server.ts]"
allowed-tools: Read, Grep, Glob, Bash, Task
---

Execute auditoria de integridade pericial do SIMIA-Verde.

Escopo: $ARGUMENTS
(Se vazio, audite todo o `src/` e o `server.ts`.)

Delegue ao agente `auditor-integridade-dados`, informando o escopo acima. Enquanto ele trabalha, faça
você mesmo a varredura léxica rápida:

```bash
grep -rnE "mock|fake|dummy|placeholder|sample|exemplo|demo|Math\.random" src/ server.ts
grep -rnE "\?\? *[0-9]|\|\| *[0-9]" src/ server.ts
grep -rn "confiabilidade: 'REAL'" src/
```

Consolide o resultado da varredura com o relatório do agente, sem duplicar achados.

## Relatório final

Organize por gravidade:

1. **Crítico** — dado fabricado que chega ao laudo pericial
2. **Grave** — fallback silencioso que converte falha de API em valor plausível
3. **Médio** — `confiabilidade` que não corresponde ao que aconteceu na chamada
4. **Médio** — ressalva obrigatória removida, encurtada ou tornada condicional
5. **Baixo** — `fonte` ou `dataConsultaUtc` ausente ou impreciso

Para cada achado: `arquivo:linha`, o trecho, o risco **em termos processuais** (o que a Defesa faria
com isso), e a correção concreta.

Encerre com um veredito de uma linha: **APROVADO** ou **REPROVADO PARA USO PERICIAL**, e, se
reprovado, a lista mínima de correções que mudaria o veredito.

Se nada for encontrado, diga o que foi verificado e considerado limpo. Não invente achados.
