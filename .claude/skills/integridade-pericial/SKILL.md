---
name: integridade-pericial
description: A regra de ouro do SIMIA-Verde — como tratar dado ausente, indisponível ou incerto sem jamais fabricar valor. Use ao escrever qualquer código que consome API, monta ItemContexto, define confiabilidade, trata catch/fallback, ou renderiza dado no laudo. Leia antes de introduzir qualquer default numérico.
---

# Integridade pericial: nunca fabricar dado

O SIMIA-Verde produz peça que instrui inquérito policial e laudo pericial oficial. Dado inventado aqui
é prova falsa em processo criminal. Esta é a restrição mais forte do projeto e vence qualquer
consideração de UX, completude visual ou elegância de código.

## O contrato

```ts
type ConfiabilidadeDado = 'REAL' | 'SIMULADO' | 'INDISPONIVEL';

interface ItemContexto<T> {
  valor: T;
  fonte: string;              // órgão/endpoint que efetivamente respondeu
  camada?: string;            // camada geoespacial consultada
  confiabilidade: ConfiabilidadeDado;
  dataConsultaUtc: string;    // instante da consulta, não do render
  observacoes?: string;       // o que não pôde ser verificado e como verificar
}
```

- `REAL` — resposta de API recebida e parseada com sucesso, **ou** aferição declarada do perito
  (e então `fonte` diz isso: "Aferição Pericial / Parametrização Técnica").
- `SIMULADO` — saída de modelo matemático explicitamente rotulada como projeção (a elipse de
  propagação). Vem sempre acompanhada da ressalva do modelo.
- `INDISPONIVEL` — não foi possível verificar. **É um resultado legítimo e frequente**, não uma falha
  a ser escondida.

## Errado × certo

```ts
// ERRADO — inventa umidade quando a API falha
umidadeRelativaPercentual: data?.current?.relative_humidity_2m ?? 45

// ERRADO — catch devolve dossiê meteorológico plausível
catch { return { ventoVelocidadeKmH: 10, umidadeRelativaPercentual: 40, confiabilidade: 'REAL' } }

// ERRADO — 0 MW afirma medição de energia radiativa nula
frpMw: foco.frp || 0

// ERRADO — vazio silencioso: operador não distingue "sem registro" de "sem consulta"
const registros = resposta.sucesso ? resposta.registros : []
```

```ts
// CERTO — a lacuna é declarada e acionável
{
  valor: { sobreposicao: false, tipoApp: 'Não verificado', distanciaMetros: 0 },
  fonte: 'DATAGEO / SIGAMgeo-SP',
  camada: 'fiscalizacao_aia_sp',
  confiabilidade: 'INDISPONIVEL',
  dataConsultaUtc: new Date().toISOString(),
  observacoes: 'Base DATAGEO não respondeu à consulta espacial (timeout 9s). '
    + 'A camada de APP não foi verificada para esta coordenada. '
    + 'Verificar manualmente em datageo.ambiente.sp.gov.br antes de concluir o laudo.'
}
```

Uma `observacoes` útil responde três perguntas: **o que** não foi verificado, **por que**, e **como**
o operador verifica por conta própria.

## Regras operacionais

1. **Nenhum número sem proveniência.** Todo valor no código vem de API, de entrada do perito, ou de
   coeficiente de modelo publicado — e neste último caso com comentário citando a fonte
   (Rothermel 1972, Alexander 1985). Coeficiente sem citação é dado fabricado.
2. **Falha nunca vira valor.** `catch` registra, sinaliza e propaga indisponibilidade. Jamais devolve
   um objeto "razoável".
3. **Ausência de detecção ≠ ausência de fogo.** Quando não há foco orbital na coordenada, o texto
   correto é "Sem anomalia térmica detectada nas últimas 24 h na coordenada" — afirma o que a
   consulta mostrou, não o que aconteceu no mundo. Satélite tem janela de passagem; fogo sob nuvem ou
   entre passagens não é detectado.
4. **Fora de cobertura é INDISPONIVEL, com explicação.** DATAGEO cobre apenas SP. Consulta em MT
   retorna indisponível, não "nenhum AIA localizado".
5. **A incerteza sobrevive até o laudo.** O caminho `analyzer.ts → reportRenderer.ts` precisa
   preservar o selo de confiabilidade. A tabela do laudo tem coluna de confiabilidade por camada
   justamente para isso — não a remova.
6. **Ressalvas são obrigatórias.** `ressalvaPreliminaridade`, `ressalvaForense` e a advertência sobre
   competência do Delegado e do MP não se removem, não se encurtam, não se condicionam.
7. **Modelo é projeção.** Toda saída de `modelFireSpread` é estimativa. Nunca enuncie como constatação.

## Revisão

Antes de concluir qualquer alteração em `services/` ou `server.ts`:

```bash
grep -rnE "mock|fake|dummy|placeholder|Math\.random|\?\? *[0-9]" src/ server.ts
```

Depois leia cada `catch`, cada `??` e cada `||` que toque campo de medição, e confirme que nenhum
deles converte falha em valor. Para auditoria completa use o agente `auditor-integridade-dados` ou o
comando `/simia-auditar`.
