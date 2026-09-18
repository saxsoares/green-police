---
name: enquadramento-legal
description: Referência de direito penal e administrativo ambiental brasileiro aplicada ao SIMIA-Verde — Lei 9.605/98, Decreto 6.514/08, Lei 12.651/12, CP Art. 250, CPP 158-A a 158-F, competência e tese de dolo/culpa. Use ao escrever ou revisar tipificação, pena, citação legal, tese de autoria ou qualquer texto jurídico do sistema.
---

# Enquadramento legal de queimadas

O sistema **instrui**; não tipifica definitivamente. Toda saída jurídica carrega ressalva de que a
tipificação definitiva e a ação penal cabem ao Delegado de Polícia e ao Ministério Público.

## Penal

| Diploma | Artigo | Conduta | Pena |
|---|---|---|---|
| Lei 9.605/1998 | **41** | Provocar incêndio em mata ou floresta | Reclusão 2–4 anos e multa. Culposo: detenção 6 meses–1 ano e multa |
| Lei 9.605/1998 | **42** | Fabricar, vender, transportar ou soltar balões | Detenção 1–3 anos ou multa, ou ambas |
| Lei 9.605/1998 | **38** | Destruir ou danificar vegetação de preservação permanente (APP) | Detenção 1–3 anos ou multa, ou ambas |
| Lei 9.605/1998 | **38-A** | Destruir vegetação primária ou secundária em estágio avançado ou médio do Bioma Mata Atlântica | Detenção 1–3 anos ou multa, ou ambas |
| Lei 9.605/1998 | **40** | Dano direto ou indireto a Unidade de Conservação | Reclusão 1–5 anos; causa de aumento |
| Código Penal | **250** | Incêndio com perigo comum | Reclusão 3–6 anos e multa; aumento para lavoura, pastagem, mata ou floresta |

## Administrativo

| Diploma | Artigo | Conduta | Sanção |
|---|---|---|---|
| Decreto 6.514/2008 | **58** | Uso de fogo em área agropastoril sem autorização ou em desacordo com a obtida | Multa de R$ 1.000,00 por hectare ou fração |
| Decreto 6.514/2008 | **43** | Destruir ou danificar vegetação de preservação permanente | Multa de R$ 5.000,00 por hectare ou fração |
| Lei 12.651/2012 | **38** | Vedação do uso do fogo, ressalvada queima controlada autorizada | Embargo administrativo e reparação civil integral |
| Lei 12.651/2012 | **40** | Política de prevenção e combate a incêndios florestais | — |

## Processual

CPP **Arts. 158-A a 158-F** — cadeia de custódia do vestígio: rastreabilidade desde o reconhecimento
até o descarte, com registro de cada etapa e do agente responsável. É o fundamento do bloco SHA-256
do SIMIA-Verde. Ver a skill `laudo-pericial-p4`.

## Regras de aplicação

**1. Tipificação é condicionada ao fato apurado.**
Art. 38 só entra com evidência de APP. Art. 40 só com incidência em UC. Art. 38-A só em Mata
Atlântica com estágio avançado ou médio. Tipificação incondicional é excesso acusatório — no
[analyzer.ts](src/services/analyzer.ts) isso se expressa em spread condicional:

```ts
...(temHidrografia ? [{ diploma: '...', artigo: 'Art. 38', ... }] : [])
```

**2. Dolo × culpa exige lastro fático.**

| Classificação | Lastro típico |
|---|---|
| Dolo Direto (Evidenciado) | vestígio de acelerante, múltiplos focos alinhados contra o vento, ignição deliberada testemunhada |
| Dolo Eventual (Assunção de Risco Proibido) | queima em condição meteorológica crítica, reincidência de AIA, omissão de aceiros regulamentares |
| Culpa Grave / Imprudência | operação de maquinário sem abafador, queima sem salvaguarda em estiagem |
| Indeterminado / Em Apuração | dados insuficientes — **é uma resposta legítima e deve ser usada** |

Reincidência de AIA é **indício**, não prova de dolo. O texto precisa dizer isso.

**3. Queima autorizada descaracteriza o ilícito.**
Com `autorizacaoQueimadaStatus === 'AUTORIZADA'`, o eixo da análise deixa de ser a ilicitude da
conduta e passa a ser a conformidade com os termos da autorização (perímetro, horário, aceiros,
comunicação prévia). A tipificação não pode ser apresentada como se a conduta fosse ilícita.

**4. Competência.**
Incidência em Unidade de Conservação federal, Terra Indígena ou dano transfronteiriço desloca a
competência para a Justiça Federal e a atribuição para a Polícia Federal. Os dados do SIPAM já trazem
`terra_indigena`, `unidade_conservacao` e `quilombola` — quando preenchidos, o texto deve sinalizar
essa consequência processual.

**5. Comarca.**
Determinada por geocodificação reversa (IBGE). Comarca errada é vício de competência.

**6. LGPD.**
Titular de imóvel CAR é exibido anonimizado (`titularAnonimizado`). A identificação plena se dá por
requisição formal da autoridade policial, não pela tela do sistema.

**7. Verifique antes de afirmar.**
A Lei 9.605/98 e o Decreto 6.514/08 já sofreram alterações. Ao redigir ou conferir pena e redação,
consulte fonte oficial (planalto.gov.br) — não confie na memória. Use o agente
`analista-juridico-ambiental` para revisão dedicada.

## Redação jurídica

Terminologia correta, tom sóbrio, sem adjetivação acusatória. Nunca afirmar autoria a partir de dado
orbital: satélite prova materialidade (houve fogo, onde, quando), não autoria. Manter sempre a
distinção entre indício, indício veemente e prova.
