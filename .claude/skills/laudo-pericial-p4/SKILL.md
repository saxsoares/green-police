---
name: laudo-pericial-p4
description: Estrutura, redação e requisitos de validade do Laudo Pericial P4 do SIMIA-Verde, incluindo cadeia de custódia SHA-256 (CPP 158-A a 158-F). Use ao alterar reportRenderer.ts, ReportView, CustodyView ou crypto.ts, ao criar seção nova do laudo, ou ao redigir qualquer texto que vá para a peça pericial.
---

# Laudo Pericial P4 e cadeia de custódia

A saída de [reportRenderer.ts](src/services/reportRenderer.ts) é peça que instrui inquérito e pode ser
juntada a processo criminal. É lida por Delegado, Promotor, Juiz e advogado de defesa — este último
procurando vício.

## Estrutura fixa

Seções, nesta ordem (não reordenar, não remover sem decisão registrada na aba "Decisões Relevantes"):

1. **Identificação e enquadramento** — ID da ocorrência, carimbo UTC, operador, coordenadas WGS84
   (6 casas) + projeção UTM/SIRGAS 2000, município/UF, comarca competente, origem da detecção,
   status da autorização de queima.
2. **Enriquecimento geoespacial** — AIA, APP, vegetação nativa, UC, CAR. Tabela com
   `camada | fonte | situação | confiabilidade`. A coluna de confiabilidade é obrigatória.
3. **Dinâmica meteorológica e propagação** — estação de referência e distância, vetor de vento, UR,
   temperatura, pressão, FWI, modelo, ROS, tabela de elipses T+1h/T+3h/T+6h.
4. **Diretrizes táticas** por força.
5. **Instrução forense** — tese de autoria/dolo com fundamentação, tipificação penal preliminar,
   tipificação administrativa, ressalva de preliminaridade, requisição Brasil M.A.I.S.
6. **Cadeia de custódia** — string canônica, SHA-256, algoritmo, etapas, operador.
7. **Ressalvas e quesitos**.

## Redação

Regras que valem para qualquer texto novo do laudo:

- **Datum e precisão.** Coordenada com 6 decimais e sistema de referência declarado. Sem datum, a
  coordenada não tem valor probatório.
- **UTC explícito.** Todo horário rotulado como UTC. Horário local sem fuso é vício.
- **Fonte e data por afirmação.** "Há sobreposição com APP" exige dizer qual base e quando consultada.
- **Condicional para estimativa.** Modelo se enuncia com "estima-se", "projeta-se", "indica
  preliminarmente" — nunca "o fogo avançou". Medição se enuncia no indicativo.
- **Materialidade × autoria.** Detecção orbital prova que houve fogo, onde e quando. Não prova quem
  ateou. Nenhuma frase pode deslizar de uma coisa para a outra.
- **Indício × prova.** Reincidência de AIA, horário atípico, múltiplos focos alinhados são indícios
  que sustentam linha investigativa — e o texto tem de dizer que são indícios.
- **Sobriedade.** Sem adjetivação, sem ênfase acusatória, sem exclamação. Tom técnico e neutro.
- **Sem sigla não expandida** na primeira ocorrência.

## Cadeia de custódia — CPP Arts. 158-A a 158-F

[crypto.ts](src/services/crypto.ts). String canônica:

```
STAMP_UTC | GEO_REF | CADASTRO_CAR | HISTORICO_SIGAMGEO | DATA_SOURCES | OPERATOR_ID
```

Montada por `buildCanonicalString()` com `trim()` em cada campo e ` | ` como separador. O hash é
SHA-256 em hexadecimal maiúsculo de 64 caracteres, via Web Crypto com fallback em TypeScript puro
(para ambiente restrito sem `crypto.subtle`).

**Determinismo é o valor jurídico do bloco.** Alterar ordem dos campos, separador, normalização ou
o conjunto de campos invalida retroativamente todo laudo já emitido: o validador deixa de reproduzir
o hash registrado, e a Defesa usa isso. Se a mudança for inevitável:

1. versione explicitamente (`algoritmo: 'SHA-256'` + um campo de versão do bloco);
2. mantenha a rotina antiga capaz de validar hashes antigos;
3. registre a decisão e a data na aba "Decisões Relevantes".

Etapas registradas, conforme Art. 158-B: **fixação** (coordenada e horário), **coleta** (ingestão de
satélite e meteorologia), **acondicionamento** (dossiê digital). O `operadorId` garante não-repúdio.

O validador (`verifyCustodyIntegrity`) **recomputa** o hash a partir da string canônica informada —
nunca compara contra valor armazenado. É essa recomputação independente que demonstra ausência de
adulteração perante o juízo.

## Exportação

- **Imprimir / PDF** — `@media print` em A4 com cabeçalho institucional SENASP.
- **Copiar Markdown** — destino são sistemas de processo eletrônico (e-SAJ, PJe, Projudi). Por isso a
  saída é Markdown puro: nada de HTML, nada de caractere que quebre colagem.

## Quesitos periciais típicos

Um laudo bem instruído responde: houve incêndio na coordenada e em que data/hora? Qual a área
atingida? Qual a tipologia da vegetação e seu estágio sucessional? Houve sobreposição com APP, UC ou
TI? Qual o ponto provável de ignição? Há indícios de ação humana? Havia autorização de queima
vigente? Quem é o responsável pelo imóvel no CAR? A conduta foi dolosa ou culposa — e com que lastro?
