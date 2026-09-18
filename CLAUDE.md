# SIMIA-Verde — Contexto de Projeto

**Sistema Integrado de Monitoramento, Inteligência Ambiental e Instrução Forense de Queimadas.**
Plataforma de apoio pericial e tático para SENASP / MJSP, Polícia Civil e Federal, Perícia Criminal,
Corpo de Bombeiros Militar e Polícia Ambiental.

## 1. Regra de ouro do domínio: verdade material pericial

Este software produz **peças que instruem inquérito policial e laudo pericial oficial**. Um dado
inventado aqui vira prova falsa em processo criminal.

**NUNCA** introduza no código:
- valores `mock`, `fake`, `seed`, `Math.random()` ou constantes plausíveis para preencher lacuna de API;
- fallback que substitui uma consulta que falhou por um valor "razoável";
- `confiabilidade: 'REAL'` em qualquer campo cuja origem não seja uma resposta de API efetivamente recebida.

Quando a fonte não responde, o caminho correto é declarar a lacuna:
`confiabilidade: 'INDISPONIVEL'` + `observacoes` explicando o que não pôde ser verificado e como o
operador deve verificar manualmente. O tipo `ItemContexto<T>` em [types.ts](src/types.ts) existe
exatamente para isso — `valor`, `fonte`, `confiabilidade`, `dataConsultaUtc`, `observacoes`.

`ConfiabilidadeDado = 'REAL' | 'SIMULADO' | 'INDISPONIVEL'` é um contrato jurídico, não um enum de UI.

## 2. Arquitetura

```
index.html → src/main.tsx → src/App.tsx
                              ├── components/Sidebar.tsx   (8 abas / ActiveTab)
                              ├── components/Header.tsx
                              └── components/views/*.tsx   (uma view por aba)
                                     ↓ consome
                              services/analyzer.ts         (orquestrador das 9 etapas)
                                     ├── apiConnectors.ts  (cliente → /api/*)
                                     ├── geoCalculations.ts(UTM, elipse, Rothermel)
                                     ├── crypto.ts         (SHA-256 / custódia)
                                     ├── reportRenderer.ts (laudo P4 em Markdown)
                                     └── ocorrenciasStorage.ts (cache local + sync /api/ocorrencias)

server.ts  →  Express :3000  →  proxy CORS para APIs governamentais
                             →  /api/ocorrencias (CRUD do dossiê)
                             →  /api/health
                             →  Vite middleware em dev / estáticos em produção
   └── server/db.ts          →  SQLite: dossiês + livro append-only de cadeia de custódia
```

O navegador **nunca** chama uma API externa diretamente. Toda fonte externa passa por uma rota
`/api/*` em [server.ts](server.ts), que isola credenciais e contorna CORS. Manter esse invariante.

### Fluxo operacional (espelha as abas)
Ingestão → Satélites & Focos → Mapa Tático → Relatório Forense P4 → Diretrizes Táticas → Cadeia de Custódia.
`processarOcorrencia()` em [analyzer.ts](src/services/analyzer.ts) executa as 9 etapas numeradas em
comentários no arquivo; qualquer camada nova entra como uma etapa numerada, na ordem.

## 3. Stack e comandos

- React 19 · Vite 8 · TailwindCSS 4 (plugin Vite, **sem** `tailwind.config.js`) · TypeScript · Leaflet · lucide-react · motion
- Backend: Express 4 em `server.ts`, executado via `tsx` em dev e bundle CJS (esbuild) em produção
- Persistência: SQLite via `better-sqlite3` (`server/db.ts`)

```bash
npm run dev     # Express + Vite middleware em http://localhost:3000
npm run lint    # tsc --noEmit  ← único portão de qualidade automatizado do repo
npm run build   # vite build + esbuild do server para dist/server.cjs
npm start       # executa dist/server.cjs

docker compose up -d                 # stack local (SIMIA_PORT, padrão 3000)
docker compose --profile dev up -d   # dev com HMR na 5173, código montado
docker compose down                  # preserva a base (bind mount em ./data)
```

Não há suíte de testes. `npm run lint` é obrigatório antes de concluir qualquer alteração.

A UI é de **tema claro** institucional (`bg-white`, `bg-sky-50`, `bg-slate-50`), com alternância
para escuro pelo rodapé da sidebar.

### Compatibilidade de navegador: Chrome/Edge 109

É a última versão dessas famílias que roda em Windows 7/8.1 — parque ainda presente em estações
de delegacia. O alvo está declarado em `browserslist` (package.json) e aplicado em
[vite.config.ts](vite.config.ts) via LightningCSS.

O TailwindCSS 4 emite a paleta em `oklch()` e as variantes de opacidade (`bg-white/70`) em
`color-mix()` — **ambos exigem Chrome 111+**. No 109 a declaração é inválida e o navegador a
descarta, e a interface carrega sem cor nem fundo. O LightningCSS converte `oklch` em hex e emite
fallback RGBA antes de cada `color-mix`, que fica protegido por `@supports`.

O que ele não cobre é a dica de espaço de cor em gradiente (`linear-gradient(to right in oklab,…)`);
há um `@supports` manual em [index.css](src/index.css) para isso.

**Ao mexer no build ou atualizar o Tailwind, reconfira:** o CSS gerado não pode ter `oklch(` nem
`color-mix(` fora de `@supports`, nem `in oklab` em gradiente desprotegido.

## 4. Fontes de dados integradas

| Fonte | Rota interna | Chave |
|---|---|---|
| SIPAM Painel do Fogo (CENSIPAM/MD) | `/api/sipam/*` | aberta |
| INPE BDQueimadas (MCTI) | `/api/focos-inpe` | aberta |
| NASA FIRMS (VIIRS 375m) | `/api/focos-nasa` | `NASA_FIRMS_MAP_KEY` |
| Open-Meteo | `/api/meteo` | aberta |
| IBGE / BrasilAPI | `/api/ibge-estados`, `/api/ibge-municipios` | aberta |
| OSM Overpass | `/api/osm-overpass` | aberta |
| DATAGEO/SIGAMgeo SP (WFS) | `/api/sigamgeo-wfs` | aberta |

APIs governamentais brasileiras caem, mudam schema sem aviso e são lentas. **Use sempre o helper
[server/proxyFetch.ts](server/proxyFetch.ts)** (`consultarFonte` + `respostaIndisponivel`): ele
retorna um tipo discriminado, o que torna estruturalmente impossível confundir "a fonte não
respondeu" com "a fonte respondeu que não há registro".

### Estado real dos conectores (auditado em 2026-09-17)

| Fonte | Estado | Observação |
|---|---|---|
| SIPAM Painel do Fogo | ✅ operacional | principal fonte em funcionamento |
| Open-Meteo | ✅ operacional | — |
| IBGE / BrasilAPI | ✅ operacional | — |
| Nominatim (geocodificação) | ✅ operacional | agora via `/api/reverse-geocode` |
| Overpass | ✅ operacional | rate limit agressivo |
| **INPE BDQueimadas** | ✅ operacional | **via GeoServer OGC** (`terrabrasilis.dpi.inpe.br/queimadas/geoserver/ows`). A API REST antiga foi desativada. Ver [server/inpeWfs.ts](server/inpeWfs.ts). |
| **INPE — TI / UC (FUNAI, MMA)** | ✅ operacional | consulta espacial `INTERSECTS` nos polígonos oficiais |
| **SIGAMgeo Público (SEMIL-SP)** | ✅ operacional | **via ArcGIS REST** em `mapas.semil.sp.gov.br`. AIA (571.769 autos) e BOI de incêndio florestal. O WFS do DATAGEO segue desativado e foi abandonado. Ver [server/sigamgeo.ts](server/sigamgeo.ts). |
| NASA FIRMS | ⚠️ requer chave | chave via header `x-nasa-map-key` (não mais na query) |

O DATAGEO, hoje quebrado, **declara a indisponibilidade corretamente**. Antes da auditoria ele
devolvia `sucesso: true` com "nenhum registro encontrado" — uma negativa falsa que ia para o laudo
marcada como `REAL`.

### SIGAMgeo Público (SEMIL-SP) — o canal atual

`https://mapas.semil.sp.gov.br/server/rest/services` (ArcGIS REST).
Descoberto no `config.json` do portal SIGAMGEO-PÚBLICO → webmap `9db55297d8594688ad95baa7465877e6`.

| Camada | Uso |
|---|---|
| `SIPAI/SIPAI_AIA_LocalOcorrencia_PUBLICO` | Autos de Infração Ambiental da Polícia Ambiental |
| `SIPAI/SIPAI_BOI_AREA_PUBLICO` | Boletins de Ocorrência de Incêndio florestal (polígono) |

**Use `mapas.semil.sp.gov.br`, não `mapas.infraestruturameioambiente.sp.gov.br`.** O segundo host
serve o mesmo conteúdo, mas o certificado TLS é emitido para `*.semil.sp.gov.br` — há
incompatibilidade de nome e o Node recusa a conexão. Não desabilite verificação de TLS para
contornar: num sistema que produz prova, aceitar certificado inválido abre caminho para
interceptação do dado pericial.

Camadas ainda não integradas e de interesse óbvio: `TEMATICOS/InventarioFlorestal_2020`
(cobertura vegetal), `SIGAM/Areas_Protegidas_Amortecimento` (zonas de amortecimento).

### GeoServer do INPE — o canal atual

`https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/ows` (WFS 1.0.0, saída GeoJSON).
Descoberto via `portal.yaml` do Programa Queimadas → "Geoserviços OGC".

| Camada | Uso |
|---|---|
| `dados_abertos:focos_{hoje,48h,mesatual,ano_atual,2020..2025}_br_{satref,todosats}` | focos com FRP, bioma, vegetação, risco de fogo, dias sem chuva |
| `bdqueimadas2:ti` | Terras Indígenas (FUNAI) — `INTERSECTS` |
| `bdqueimadas:uc_f_nao_reservas` | UCs federais (MMA) — `INTERSECTS` |
| `bdqueimadas2:uc_e_nao_reservas` | UCs estaduais — `INTERSECTS` |

`satref` é o satélite de referência (série oficial do INPE, citável em laudo); `todosats` traz volume
muito maior e serve a varredura tática. `biomas_brasileiros` e `municipios` só existem como WMS, mas
bioma e vegetação já vêm como atributo de cada foco.

## 5. Convenções

- **Idioma:** domínio, tipos, comentários, UI e mensagens de erro em **português**. Termos jurídicos e
  periciais literais (AIA, CAR, APP, UC, FRP, FWI, comarca, laudo) não são traduzidos nem abreviados.
- **Tipos primeiro:** toda estrutura de dados nova entra em [src/types.ts](src/types.ts) antes do uso.
- **Nomes de função** em português quando exprimem o domínio (`processarOcorrencia`), em inglês quando
  são utilitários técnicos (`latLngToUtm`, `modelFireSpread`).
- **UI:** tema escuro tático (`slate-900/950`, acentos `emerald`/`amber`/`red`), Tailwind inline,
  ícones `lucide-react`. Sem biblioteca de componentes.
- **Persistência:** `localStorage` (`simia_dossies_forenses_v1`). Sem banco, sem backend de estado.
- **LGPD:** titular de imóvel CAR é exibido anonimizado (`titularAnonimizado`). Não remova essa camada.

## 6. Persistência em duas camadas

| Camada | Papel | Onde |
|---|---|---|
| `localStorage` | cache offline — trabalho de campo com conexão intermitente (README §7.3) | navegador |
| SQLite | sistema de registro durável e auditável | `server/db.ts` → bind mount `./data` (prod) e `./data-dev` (dev) |

`sincronizarComServidor()` reconcilia as duas na abertura: a base é a referência, e dossiês criados
offline são enviados para ela. **Nenhum dossiê é descartado na reconciliação.** Se a base estiver
indisponível, o sistema opera só com o cache e o Header exibe `SOMENTE LOCAL` — o perito precisa
saber que aquele dossiê ainda não tem registro de custódia no servidor.

Tabelas: `ocorrencias` (dossiê verbatim em JSON) e `custodia_eventos` (livro **append-only**,
com gatilhos SQLite que recusam UPDATE e DELETE, conforme CPP Art. 158-A). O livro **não** tem
cascade: ele sobrevive à remoção do dossiê e registra a própria remoção como evento.

Migrações por `PRAGMA user_version` em `aplicarEsquema()`. Esquema atual: v1.

## 7. Camadas deliberadamente NÃO verificadas

O sistema não possui integração para estas camadas. Elas são marcadas `INDISPONIVEL` com orientação
ao operador — **não preencha com valor plausível**:

- **Estágio sucessional da vegetação** — bioma e fitofisionomia agora vêm do INPE (atributo do foco
  mais próximo, com a distância sempre declarada), mas o **estágio sucessional** não é fornecido por
  nenhuma fonte integrada. A tipificação do Art. 38-A da Lei 9.605/98 depende dele.
- **Sobreposição com APP** — o Overpass informa *presença* de feição hídrica no raio de 3 km, não a
  *distância* à margem. Sobreposição exige medição.
- **Geometria do CAR** — sem integração com o SICAR. Por isso o mapa tático **não desenha** perímetro
  de propriedade: desenhar um polígono arbitrário levaria à identificação do proprietário errado.
- **Autorização de queima controlada** — sem integração com cadastros estaduais.
- **Área queimada em hectares** — o BOI do SIGAMgeo traz o polígono do incêndio, mas o campo
  `AreaAbrangida` é CATEGÓRICO (`Dentro` / `Entorno`), não medida. Calcular a área exigiria
  processar a geometria do polígono, o que ainda não é feito.

## 8. Pontos sensíveis

- [crypto.ts](src/services/crypto.ts) — o payload canônico está na **V3**. Histórico: V2 trocou os
  binários SIM/NAO por NAO_VERIFICADO (V1 certificava falsa negativa); V3 renomeou
  `AIA_REINCIDENCIA` para `AIA_ENTORNO`, porque o campo afirmava uma conclusão jurídica que o
  sistema não apura, e acrescentou `BOI_INCENDIO`. **Nome de campo no payload é afirmação
  certificada pelo hash** — se o nome promete mais do que a consulta apura, o hash assina um
  excesso. Versões antigas seguem validáveis: o validador recomputa a partir da string informada.
- [crypto.ts](src/services/crypto.ts) — a string canônica e o SHA-256 são **determinísticos e
  auditáveis**. Alterar a ordem dos campos, o separador ` | ` ou o `trim()` invalida retroativamente
  todos os laudos já emitidos. Mudança aqui exige versionamento explícito do bloco de custódia.
- [reportRenderer.ts](src/services/reportRenderer.ts) — a estrutura de seções do laudo P4 segue
  requisito da SENASP; seções não se removem nem se reordenam livremente.
- Tipificações penais em [analyzer.ts](src/services/analyzer.ts) citam Lei 9.605/98, Decreto 6.514/08
  e Lei 12.651/12. Artigo, pena e redação devem conferir com a lei vigente.
- A `ressalvaPreliminaridade` e a `ressalvaForense` são **obrigatórias** em toda saída analítica:
  o sistema instrui, não tipifica definitivamente. Essa atribuição é do Delegado e do MP.
- [server/db.ts](server/db.ts) — a camada de persistência **armazena e devolve verbatim**. Não
  completa campo ausente, não normaliza valor, não sintetiza registro. Linha ilegível é reportada
  em `corrompidas`, nunca substituída por objeto plausível.
- O modelo de propagação roda com **combustível de referência** quando a vegetação não foi
  verificada, e a `ressalvaForense` declara isso. Não remova essa declaração.
- **Padrões de ignore precisam de barra inicial.** `data/` no `.gitignore` casa em qualquer
  profundidade e chegou a excluir `src/data/` do repositório — o build quebrava em outra máquina
  com `Could not resolve '../data/estadosBrasil'`, enquanto passava localmente (o arquivo estava
  em disco, só não no git). Use `/data/` e `/data-dev/`. Ao ignorar uma pasta da raiz, sempre ancore.
- O repositório não tem `package-lock.json` (só `bun.lock`), então o build Docker usa `npm install`.
  Para uma ferramenta pericial, build reproduzível é desejável: comitar um lockfile npm fecharia
  essa lacuna de auditabilidade da cadeia de suprimentos.
