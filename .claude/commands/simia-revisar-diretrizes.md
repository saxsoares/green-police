---
description: Revisão da doutrina tática tripartite (Bombeiros, Ostensivo/Ambiental, Judiciária/Perícia)
argument-hint: "[força específica: bombeiros | ostensivo | judiciaria]"
allowed-tools: Read, Grep, Glob, Task
---

Revise as diretrizes táticas que o SIMIA-Verde entrega às forças de segurança.

Foco: $ARGUMENTS
(Se vazio, revise as três forças.)

## Procedimento

Delegue ao agente `doutrina-operacional`, indicando o foco. Em paralelo, verifique você mesmo a
coerência entre camadas — é onde o sistema costuma se contradizer:

1. O azimute citado nas diretrizes bate com `projecao.manchas.t1h.azimutePropagacaoGraus`?
2. A direção de recuo é realmente `(azimute + 180) % 360` — a barlavento?
3. Vento, umidade e risco citados no texto batem com o objeto `meteo` da mesma ocorrência?
4. As feições nomeadas (vias, cursos d'água) vêm de fato do retorno do Overpass, ou são genéricas?
5. Quando o Overpass não retorna feição, o texto **declara** a ausência de mapeamento em vez de
   inventar uma "estrada vicinal local"?

Arquivos: `DiretrizesTaticas` em [analyzer.ts](src/services/analyzer.ts) (etapa 7) e
[DirectivesView.tsx](src/components/views/DirectivesView.tsx).

## Critérios

- **Específico, não genérico.** "Estabelecer aceiro" é inútil; "aceiro ancorado na margem da Estrada
  Vicinal X, perpendicular ao azimute 135°" é operável.
- **Segurança da guarnição primeiro.** Toda diretriz que direciona pessoal de combate precisa de rota
  de fuga e zona de segurança correspondentes (LCES).
- **Preservação de vestígio.** Nenhuma recomendação pode induzir destruição do vértice de ignição. Em
  conflito entre combate e preservação, a diretriz reconhece a tensão e indica o procedimento.
- **Competência.** Não misture tipificação penal na diretriz de bombeiro nem tática de combate na
  diretriz de perícia.
- **Linguagem de comando.** Frases curtas, imperativas, com referência geográfica.

## Relatório

Por força: o que está genérico demais para ser executado, o que é **inseguro** para a guarnição, o que
contradiz os dados da ocorrência, e o que falta (rescaldo, reignição, virada de vento, evacuação).

Reescreva cada diretriz problemática na forma correta. Priorize achados de segurança de guarnição —
são os únicos com potencial de dano físico.
