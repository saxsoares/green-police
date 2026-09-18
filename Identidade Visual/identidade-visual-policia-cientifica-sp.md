# Identidade Visual — Polícia Científica do Estado de São Paulo (SPTC)

> **O que é este arquivo.** Especificação de identidade visual da Polícia Científica de SP (Superintendência da Polícia Técnico-Científica — SPTC), escrita como instrução direta para um assistente de IA (Claude Code, Cursor, etc.) gerar telas e sistemas no padrão da Instituição. É autocontido: tokens, regras, CSS pronto e esqueleto HTML. Anexe ou cole este arquivo inteiro junto com o pedido do sistema.
>
> **Procedência.** Extraído do portal https://www.policiacientifica.sp.gov.br/ em 17/09/2026, lendo `/css/custom.css` (138 regras), `/css/govsp.css`, o Bootstrap 4.5.2 e os estilos computados no navegador a 1366 px, nas páginas home, "Funções e Competências", "Identidade Visual" e "Consulta de Situação de Laudos", com conferência visual por screenshot.
>
> **PENDÊNCIA ABERTA.** A SPTC publica um manual oficial de identidade visual em `/images/pilares/identidade_visual.pdf` (menu Institucional → Identidade Visual). **Não foi possível lê-lo**: o PDF é composto apenas de imagens, sem camada de texto, e o visualizador do navegador não permitiu captura das páginas. Tudo neste documento descreve **o que o site aplica**, não o que o manual determina. Onde houver divergência, **o manual prevalece** — confira nele a paleta oficial (com CMYK e Pantone), a tipografia e as regras de uso do brasão antes de fechar requisitos. Compare com o caso da Polícia Civil, onde o manual oficial mostrou uma paleta bem diferente da que o portal usava.
>
> **Nomes inventados.** Os nomes de tokens (`--sptc-*`) e de classes (`.sptc-*`) são convenção deste documento, não do site.

---

## 0. Regras inegociáveis

Ao gerar qualquer tela para a Polícia Científica, o assistente DEVE:

1. **Usar o azul `#2F65B1` como cor institucional** (barra de navegação, títulos de atalho) e o vermelho apenas como acento.
2. **Colocar o filete vermelho `#AB0000` de 5 px sob a barra de navegação.** É a assinatura visual do portal.
3. **Usar `#2F65B1` ou `#034EA2` no botão primário.** O site usa o azul padrão do Bootstrap (`#007BFF`) em pelo menos uma tela — isso é descuido, não padrão, e além disso reprova em contraste.
4. **Manter os dois regimes de raio:** 4–5 px em campos, abas, alertas e botões comuns; 25–35 px ou pill em cartões e botões de destaque. Não unifique tudo em um só.
5. **Escrever menu e títulos de página em CAIXA ALTA.**
6. **Não copiar os defeitos técnicos do site** listados na seção 8 (dois JS de Bootstrap simultâneos, `z-index: 99999`, `nowrap` + `break-all`).
7. **Nunca redesenhar, recolorir, inclinar ou distorcer o distintivo.** Ver seção 9.
8. **Antes de fechar requisitos, obter e conferir o manual oficial.** Ver a pendência acima.

---

## 1. A identidade em uma frase

O mais recente e o mais leve dos três portais policiais de SP: barra azul com filete vermelho, distintivo dourado grande que ultrapassa a barra, conteúdo sobre branco com muito respiro, formas bem arredondadas e um cartão de atalhos flutuando sobre o banner com sombra difusa.

---

## 2. Tokens de cor

### 2.1 Azuis (institucionais)

| Token | Hex | Onde o site usa |
|---|---|---|
| `--sptc-azul` | `#2F65B1` | Barra de navegação, título dos atalhos, ícones sociais, hover de links dos atalhos |
| `--sptc-azul-dropdown` | `#3163AF` | Fundo do menu suspenso |
| `--sptc-azul-hover` | `#1E53A3` | Hover de item do menu suspenso |
| `--sptc-azul-escuro` | `#0A3C7C` | Botão hambúrguer (mobile) |
| `--sptc-azul-govsp` | `#034EA2` | Botões pill (Ouvidoria etc.); hover `#024592`. É o azul do Governo de SP |

### 2.2 Vermelhos e verde (acento)

| Token | Hex | Onde o site usa |
|---|---|---|
| `--sptc-vermelho-filete` | `#AB0000` | Filete de 5 px sob a barra de navegação |
| `--sptc-vermelho` | `#C00606` | Botão de ação ("Saiba mais"), nome em card de autoridade, círculos numerados do passo a passo |
| `--sptc-vermelho-escuro` | `#860303` | Subtítulos pequenos |
| `--sptc-verde` | `#34BD28` | Botão de download; borda `#18AB29`, hover `#1C8B13` |

### 2.3 Texto, neutros e superfícies

| Token | Hex | Onde o site usa |
|---|---|---|
| `--sptc-texto` | `#212529` | Texto base (padrão Bootstrap 4) |
| `--sptc-titulo` | `#000000` | Título de página |
| `--sptc-nav-texto` | `#F0F0F0` | Texto do menu; fundo dos botões de rede social |
| `--sptc-tab-ativa` / `--sptc-tab-inativa` | `#0E0E0E` / `#A3A3A3` | Abas |
| `--sptc-borda-escura` | `#262626` | Contorno de 2 px dos cards de editais e de passo a passo |
| `--sptc-separador` | `#666666` | Divisor vertical entre atalhos |
| `--sptc-borda` / `--sptc-campo-borda` | `#DEE2E6` / `#CED4DA` | Abas e tabelas / campos (Bootstrap 4) |
| `--sptc-campo-texto` | `#495057` | Texto dentro de campos |
| `--sptc-fundo-faixa` | `#F5F4F3` | Faixa de links de governo; também a cor do texto no rodapé |
| `--sptc-fundo-card` / `--sptc-fundo-card-2` | `#E9E9E9` a 83 % / `#EEEEEE` | Card de autoridade / card social |
| `--sptc-rodape` | `#444444` | Rodapé |

### 2.4 Feedback (padrão Bootstrap 4)

Alerta informativo: texto `#0C5460`, fundo `#D1ECF1`, borda `#BEE5EB`. O site usa também SweetAlert para diálogos de confirmação e erro.

`--sptc-bs-primary` (`#007BFF`) está no CSS apenas para documentar o que o site faz hoje. **Não é cor da marca e não deve ser usado.**

### 2.5 Cores do distintivo (NÃO usar na interface)

Medidas pixel a pixel em `logos/sptc-brasao-2024.png`: azul-marinho `#2C2755`; amarelo em degradê de `#F9DB36` (topo esquerdo) a `#FBC93C` (base direita), com `#FAD737` como tom médio.

O azul-marinho do distintivo é bem mais escuro que o azul da interface (`#2F65B1`). São cores diferentes com funções diferentes — não unifique. **Valores sujeitos a confirmação no manual oficial.**

---

## 3. Tipografia

O site **não define fonte própria**: usa a pilha de sistema do Bootstrap 4 —
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif` — que no Windows renderiza em **Segoe UI**.

Montserrat (400/500/600) aparece carregada, mas pertence à barra do Governo de SP.

**Se o manual oficial definir uma família tipográfica, ela substitui esta seção inteira.**

| Elemento | Tamanho / linha | Peso | Cor | Observação |
|---|---|---|---|---|
| `body` / `p` | 16 px / 24 px | 400 | `#212529` | parágrafo com margem inferior de 16 px |
| Título de página | 30 px / 45 px | bold | `#000000` | CAIXA ALTA, alinhado à esquerda |
| `h1` de conteúdo | 40 px / 48 px | bold | `#212529` | |
| `h2` | 32 px / 38 px | bold | | |
| `h5` (abas, rodapé) | 20 px / 24 px | bold | | |
| Subtópico / pergunta | 22 px | bold | `#000000` | |
| Subtítulo | 14 px | bold | `#860303` | |
| Parágrafo de destaque | 15,5 pt | 400 | | |
| Menu principal | 16 px | bold | `#F0F0F0` | CAIXA ALTA |
| Item do menu suspenso | 16 px | 400 | branco | CAIXA ALTA |
| Atalho: título / descrição | 16 px semibold / 13,6 px (0,85 rem), linha 19 px | 600 / 400 | `#2F65B1` / `#212529` | título em CAIXA ALTA |
| Tabela | 12 px | `th` bold | | |
| Rodapé: título / texto | 20 px bold caixa alta / 12 pt | | `#F5F4F3` | |

Todos os `h1`–`h5` são bold por regra global do site.

O corpo de texto é **16 px**, contra 14 px dos portais da PM e da Civil. Mantenha 16 px.

---

## 4. Layout e grid

- **Framework:** Bootstrap 4.5.2. Container de **1140 px**; a página inteira é limitada a **1920 px**.
- **Responsivo:** sim. Além dos breakpoints do Bootstrap (576 / 768 / 992 / 1200), o `custom.css` cria faixas próprias: ≤300, 301–400, 401–600, 601–700, 701–860, 860–1060, 1061–1200 e 1201–1400. Na prática os cortes que importam são **~860 px** (conteúdo passa a padding de 5 %, cards empilham, números de passo centralizam) e **~1060 px** (barra de navegação colapsa em hambúrguer). **Para um sistema novo, use só os breakpoints do Bootstrap** — essa proliferação de faixas é dívida técnica.
- **Ordem da página:** barra GovSP branca (80 px, externa) → barra azul de 88 px fixa ao rolar → banner/carrossel de até 600 px → cartão branco flutuante com atalhos → conteúdo → faixa `#F5F4F3` com logos de órgãos → rodapé `#444444` em colunas → rodapé GovSP (externo).
- **Área de conteúdo:** margem vertical de 100 px e padding de 100 px no desktop; padding de 5 % abaixo de 860 px.
- **Espaçamento:** generoso — 100 px em volta do conteúdo, 50 px entre cards, 40 px no rodapé.

---

## 5. Componentes — regras de construção

### Barra de navegação
88 px de altura, fundo `#2F65B1`, **borda inferior de 5 px `#AB0000`**, `position: sticky; top: 0`, padding 8×16 px. O distintivo é exibido com 122 px de largura reduzidos a 80 %, deslocado 25 px para baixo e 40 px da esquerda, de modo que **ultrapassa a borda inferior da barra** — esse transbordo é característico e deve ser mantido. Itens do menu à direita, 16 px bold caixa alta `#F0F0F0`. À direita de tudo, ícones sociais em botões claros: fundo `#F0F0F0`, ícone `#2F65B1`, padding 5×15 px, raio 5 px. Abaixo de ~1060 px a barra ganha altura automática e vira hambúrguer (`#0A3C7C` com ícone branco); os ícones sociais somem.

### Menu suspenso
Fundo `#3163AF`, borda `rgba(0,0,0,.15)`, raio 4 px, itens com padding 4×24 px em branco, hover `#1E53A3`. Tem submenus de segundo nível.

### Cartão flutuante de atalhos
Bloco branco, **raio de 25 px**, largura máxima de 65 %, sobreposto ao banner com margem superior negativa de 20 px e `filter: drop-shadow(5px 5px 25px rgba(0,0,0,.3))`. Colunas separadas por linha vertical de 1 px `#666666` (que somem abaixo de 990 px), cada uma com ícone de 28 px, título azul semibold em caixa alta e descrição de 13,6 px.

### Botões

| Variante | Fundo | Forma | Uso |
|---|---|---|---|
| Ação | `#C00606` | raio 5 px, padding 10 px | "Saiba mais" (é o `.btn-danger` do Bootstrap recolorido) |
| Pill | `#034EA2`, texto `#F5F4F3` bold centralizado | raio 100 px, padding vertical 16 px | Ouvidoria, SIC e afins; hover `#024592` |
| Download | `#34BD28`, borda `#18AB29` | raio 18 px, padding 16×56 px, 17 px bold com `text-shadow` | Download de arquivo; hover `#1C8B13` |

O site **não define hover para o botão de ação**. Defina um (escurecer ~10 %).

### Formulários
Padrão Bootstrap 4: campo de 38 px, padding 6×12 px, borda `#CED4DA`, raio 4 px, texto `#495057`, foco com halo azul. Labels em 16 px peso 400, acima do campo. Questionários usam radio ampliado em 1,5× e textarea com contorno preto de 2 px e raio 5 px. Formulários longos usam stepper (bs-stepper).

### Abas
`nav-tabs` do Bootstrap com linha inferior de ~3 px `#DEE2E6` (mais grossa que o 1 px padrão). Aba ativa: fundo branco, borda `#DEE2E6`, texto `#0E0E0E`. Inativas: `#A3A3A3` — **ver ressalva de contraste na seção 8**. O rótulo de cada aba é um `h5` de 20 px bold.

### Tabelas
`table-bordered` do Bootstrap: bordas `#DEE2E6`, células com padding 12 px, fonte de 12 px, cabeçalho bold **sem fundo colorido**. Não há zebra nem hover. Para um sistema com muitos dados, isso é insuficiente — defina zebra e hover próprios, mantendo a paleta.

### Cards
Contorno (editais, passo a passo): borda de 2 px `#262626` ou preta, **raio 25 px**, padding 30 px, margem vertical 50 px. O passo a passo leva um círculo vermelho `#C00606` de 160 px com número branco de 60 pt. Autoridade: 350 px de largura, fundo `rgba(233,233,233,.83)`, **raio 35 px**, foto de 400 px de altura com topo arredondado, nome em `#C00606` bold, cargo em 12 pt bold, descrição justificada com rolagem.

### Rodapé
Faixa `#F5F4F3` com logos de órgãos, seguida de bloco `#444444` com padding de 40 px, colunas de links em `#F5F4F3` e títulos de 20 px bold caixa alta.

---

## 6. Forma e movimento

Dois regimes de raio convivem e ambos fazem parte da identidade: **4–5 px** nos elementos herdados do Bootstrap (campos, abas, alertas, botões comuns) e **18–35 px ou pill** nos elementos próprios (cartão de atalhos, cards, botão de download, botões de rodapé).

Sombra: apenas no cartão flutuante de atalhos, com `drop-shadow(5px 5px 25px rgba(0,0,0,.3))`. Transições de 0,2–0,3 s.

---

## 7. Ativos de marca

Arquivos na pasta `logos/` (e em `logos-policias-sp.zip`):

| Arquivo | Origem | Formato | Como usar |
|---|---|---|---|
| **`logos/sptc-brasao-2024.png`** | `/images/logo/novo_brazao_atualizado_2024.png` | PNG 1427×1805, RGBA **transparente**, 542 KB | Distintivo em forma de escudo: amarelo em degradê com borda dourada, faixas azul-marinho "POLÍCIA" e "CIENTÍFICA" em branco e o brasão do Estado de SP ao centro. Boa resolução, funciona sobre qualquer fundo. É o melhor arquivo de logo das três polícias. |
| `logos/sptc-favicon.png` | `/images/icones/icones-39.png` | PNG 154×194 RGBA | Versão reduzida, usada como favicon |

**Não disponível no site:** versão vetorial (SVG/AI/EPS), versão monocromática, versão negativa e assinatura horizontal (distintivo + nome por extenso). Essas versões, se existirem, estão no manual oficial em `/images/pilares/identidade_visual.pdf` — que é só imagem e não foi lido. **Peça à SPTC o distintivo em vetor e o manual em versão legível.**

Os ícones dos atalhos ficam em `/images/icones/` (não baixados).

A barra e o rodapé do Governo de São Paulo são componentes externos: se o sistema for público, inclua-os pelos scripts oficiais (`saopaulo.sp.gov.br/barra-govsp/`), não os recrie.

---

## 8. Acessibilidade e defeitos do site

As cores da marca passam na WCAG AA:

| Combinação | Contraste | Situação |
|---|---|---|
| `#F0F0F0` sobre `#2F65B1` (menu) | 5,09:1 | Aprova |
| branco sobre `#3163AF` (dropdown) | 5,94:1 | Aprova |
| branco sobre `#C00606` (botão de ação) | 6,42:1 | Aprova |
| `#F5F4F3` sobre `#444444` (rodapé) | 8,87:1 | Aprova |
| `#F5F4F3` sobre `#034EA2` (pill) | 7,31:1 | Aprova |
| `#A3A3A3` sobre branco (aba inativa) | 2,52:1 | **Reprova** — escureça para ~`#767676` |
| branco sobre `#34BD28` (download) | 2,48:1 | **Reprova** — escureça o verde ou use texto escuro |
| branco sobre `#007BFF` (botão Bootstrap) | 3,98:1 | **Reprova** — não use esse azul |

**Defeitos técnicos que não devem ser reproduzidos:**

- O site carrega o JS do **Bootstrap 5.1.3 e do 4.6.1 ao mesmo tempo**, junto com o CSS do 4.5.2. Escolha uma versão.
- `z-index: 99999` na barra de navegação, que a coloca acima de modais.
- `white-space: nowrap` combinado com `word-break: break-all` em todos os `h1`–`h5`, o que quebra palavras no meio em telas estreitas.
- Botão de ação sem estado de hover.
- Tabelas sem zebra nem hover.

---

## 9. Restrições de uso da marca

- Não redesenhe, recolora, incline, distorça, recorte nem adicione elementos ao distintivo.
- Não gere uma "versão nova" ou "modernizada" da marca.
- Se o sistema não for da própria SPTC, obtenha autorização formal antes de aplicar o distintivo.
- **Confira as regras oficiais no manual** (área de proteção, redução mínima, versões permitidas, fundos permitidos). Elas não puderam ser lidas e este documento não as substitui.

---

## 10. CSS pronto

Salve como `sptc-theme.css`. Os valores marcados `[BS4]` são padrões do Bootstrap 4 que o site usa sem customizar.

```css
/* ==========================================================================
   Polícia Científica SP (SPTC) — tema base extraído de
   https://www.policiacientifica.sp.gov.br/
   Fonte: /css/custom.css (138 regras), /css/govsp.css, Bootstrap 4.5.2 (CDN)
   + estilos computados a 1366px. Extraído em 17/09/2026.
   Valores são os do site; nomes de tokens e classes .sptc-* são convenção nossa.
   Onde o site usa o Bootstrap 4 sem customizar (campos, tabelas, alertas, abas),
   os valores abaixo são os padrões do Bootstrap 4 — estão marcados como [BS4].
   ========================================================================== */

:root {
  /* --- Marca --- */
  --sptc-azul:            #2F65B1; /* barra de navegação, títulos dos atalhos, ícones sociais */
  --sptc-azul-dropdown:   #3163AF; /* fundo do dropdown */
  --sptc-azul-hover:      #1E53A3; /* hover de item do dropdown */
  --sptc-azul-escuro:     #0A3C7C; /* botão hambúrguer */
  --sptc-azul-govsp:      #034EA2; /* botões pill (Ouvidoria etc.); hover #024592 */
  --sptc-azul-govsp-hover:#024592;
  --sptc-vermelho-filete: #AB0000; /* filete de 5px sob a barra */
  --sptc-vermelho:        #C00606; /* botão de ação, títulos de card, círculos numerados */
  --sptc-vermelho-escuro: #860303; /* subtítulos */
  --sptc-verde:           #34BD28; /* botão de download; borda #18AB29; hover #1C8B13 */
  --sptc-verde-hover:     #1C8B13;
  /* Distintivo (medido no arquivo logos/sptc-brasao-2024.png — só referência): */
  --sptc-brasao-amarelo:  #F9DB36;
  --sptc-brasao-ouro:     #FBC93C;
  --sptc-brasao-azul:     #2C2755;

  /* --- Texto e neutros --- */
  --sptc-texto:           #212529; /* [BS4] corpo */
  --sptc-titulo:          #000000; /* título de página */
  --sptc-nav-texto:       #F0F0F0;
  --sptc-tab-inativa:     #A3A3A3;
  --sptc-tab-ativa:       #0E0E0E;
  --sptc-borda-escura:    #262626; /* cards de contorno (editais, passos) */
  --sptc-separador:       #666666; /* divisor vertical dos atalhos */
  --sptc-borda:           #DEE2E6; /* [BS4] abas, tabelas */
  --sptc-campo-borda:     #CED4DA; /* [BS4] */
  --sptc-campo-texto:     #495057; /* [BS4] */
  --sptc-fundo:           #FFFFFF;
  --sptc-fundo-faixa:     #F5F4F3; /* faixa de links de governo; também cor do texto no rodapé */
  --sptc-fundo-card:      #E9E9E9; /* card de autoridade (83% de opacidade) */
  --sptc-fundo-card-2:    #EEEEEE;
  --sptc-rodape:          #444444;

  /* --- Feedback [BS4] --- */
  --sptc-info-texto:      #0C5460;
  --sptc-info-fundo:      #D1ECF1;
  --sptc-info-borda:      #BEE5EB;
  --sptc-bs-primary:      #007BFF; /* usado no "Pesquisar" da consulta de laudos — NÃO é cor da marca */

  /* --- Tipografia --- */
  --sptc-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; /* pilha de sistema do BS4; no Windows renderiza em Segoe UI */
  --sptc-font-govsp: Montserrat, Verdana, sans-serif; /* só na barra do Governo de SP */
  --sptc-fs-base: 16px;  /* corpo, menu, campos, botões; linha 24px */
  --sptc-fs-sm: 13.6px;  /* descrição dos atalhos (0.85rem) */
  --sptc-fs-tabela: 12px;
  --sptc-fs-h5: 20px;
  --sptc-fs-subtopico: 22px;
  --sptc-fs-titulo: 30px; /* .titulos — título de página, bold, preto, caixa alta */
  --sptc-fs-h2: 32px;
  --sptc-fs-h1: 40px;

  /* --- Forma --- */
  --sptc-raio: 4px;          /* [BS4] campos, abas, alertas, dropdown */
  --sptc-raio-btn: 5px;      /* botões e ícones sociais */
  --sptc-raio-download: 18px;
  --sptc-raio-card: 25px;    /* cartão flutuante de atalhos, cards de contorno */
  --sptc-raio-card-lg: 35px; /* card de autoridade */
  --sptc-raio-pill: 100px;
  --sptc-sombra-flutuante: drop-shadow(5px 5px 25px rgba(0,0,0,.3));
  --sptc-container: 1140px;  /* [BS4]; página limitada a 1920px */
}

/* ---------- Base ---------- */
html, body { overflow-x: hidden; }
body { margin: 0; font-family: var(--sptc-font); font-size: 16px; line-height: 1.5; color: var(--sptc-texto); background: var(--sptc-fundo); }
h1, h2, h3, h4, h5 { font-weight: bold; line-height: 1.2; margin: 0 0 8px; }
h1 { font-size: 40px; } h2 { font-size: 32px; } h5 { font-size: 20px; }
p { margin: 0 0 16px; }
.sptc-pagina { max-width: 1920px; margin: 0 auto; }
.sptc-conteudo { margin: 100px 0; padding: 100px; }            /* .master_content; vira padding 5% abaixo de 860px */
.sptc-conteudo ul { padding-left: 14pt; list-style: disc; }

/* ---------- Barra de navegação (fixa no topo ao rolar) ---------- */
.sptc-navbar {
  display: flex; align-items: center; height: 88px; width: 100%; padding: 8px 16px;
  background: var(--sptc-azul); border-bottom: 5px solid var(--sptc-vermelho-filete);
  position: sticky; top: 0; z-index: 99999;
  font-weight: bold; color: var(--sptc-nav-texto);
}
.sptc-navbar__brasao { width: 122px; margin-left: 40px; position: relative; top: 25px; transform: scale(.8); } /* o brasão "vaza" para baixo da barra */
.sptc-navbar a { color: var(--sptc-nav-texto); font-size: 16px; font-weight: bold; text-transform: uppercase; white-space: nowrap; padding: 8px; margin: 10px 15px 10px 10px; text-decoration: none; }
.sptc-dropdown { background: var(--sptc-azul-dropdown); border: 1px solid rgba(0,0,0,.15); border-radius: var(--sptc-raio); padding: 8px 0; }
.sptc-dropdown a { display: block; color: #FFF; font-weight: 400; padding: 4px 24px; margin: 0; }
.sptc-dropdown a:hover { background: var(--sptc-azul-hover); }
.sptc-navbar__social { background: var(--sptc-nav-texto); color: var(--sptc-azul); padding: 5px 15px; border-radius: var(--sptc-raio-btn); margin-left: 10px; }
.sptc-navbar__toggler { background: var(--sptc-azul-escuro); color: #FFF; }

/* ---------- Títulos de página ---------- */
.sptc-titulo { font-size: 30px; font-weight: bold; color: var(--sptc-titulo); text-align: left; text-transform: uppercase; } /* caixa alta vem do conteúdo no site */
.sptc-subtopico { font-size: 22px; font-weight: bold; color: #000; text-align: left; }
.sptc-subtitulo { font-size: 14px; font-weight: bold; color: var(--sptc-vermelho-escuro); }
.sptc-paragrafo-destaque { font-size: 15.5pt; margin: 20px 0; }

/* ---------- Cartão flutuante de atalhos (sobre o banner da home) ---------- */
.sptc-atalhos {
  position: relative; max-width: 65%; margin: -20px auto 0; padding: 25px 22px 16px;
  background: #FFF; border-radius: var(--sptc-raio-card); filter: var(--sptc-sombra-flutuante);
}
.sptc-atalho { padding: .5rem; border-right: 1px solid var(--sptc-separador); overflow: hidden; }
.sptc-atalho:last-child { border-right: 0; }
.sptc-atalho img { height: 28px; margin-right: 6px; }
.sptc-atalho h5 { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.2; color: var(--sptc-azul); text-transform: uppercase; }
.sptc-atalho span { display: block; margin-top: .25rem; font-size: .85rem; line-height: 1.2rem; color: var(--sptc-texto); }
.sptc-atalho a { text-decoration: none; transition: color .2s; }
.sptc-atalho a:hover { color: var(--sptc-azul); }
@media (max-width: 990px) { .sptc-atalho { border-right: 0; } }

/* ---------- Botões ---------- */
.sptc-btn { display: inline-block; padding: 10px; border: 1px solid transparent; border-radius: var(--sptc-raio-btn); font-size: 16px; line-height: 1.5; color: #FFF; text-decoration: none; cursor: pointer; max-width: fit-content; }
.sptc-btn--acao { background: var(--sptc-vermelho); border-color: #DC3545; }            /* .btn-danger customizado ("Saiba mais") */
.sptc-btn--pill { display: block; max-width: none; background: var(--sptc-azul-govsp); color: var(--sptc-fundo-faixa); font-weight: bold; text-align: center; border-radius: var(--sptc-raio-pill); padding: 16px 0; }
.sptc-btn--pill:hover { background: var(--sptc-azul-govsp-hover); }
.sptc-btn--download { background: var(--sptc-verde); border-color: #18AB29; border-radius: var(--sptc-raio-download); font-size: 17px; font-weight: bold; padding: 16px 56px; text-shadow: 0 1px 0 #2F6627; }
.sptc-btn--download:hover { background: var(--sptc-verde-hover); }
.sptc-btn--bs-primary { background: var(--sptc-bs-primary); border-color: var(--sptc-bs-primary); padding: 6px 12px; border-radius: var(--sptc-raio); } /* [BS4] como está hoje no site; ver nota no guia */

/* ---------- Formulários [BS4] ---------- */
.sptc-campo { display: block; width: 100%; height: 38px; padding: 6px 12px; font: inherit; color: var(--sptc-campo-texto); background: #FFF; border: 1px solid var(--sptc-campo-borda); border-radius: var(--sptc-raio); }
.sptc-campo:focus { outline: 0; border-color: #80BDFF; box-shadow: 0 0 0 .2rem rgba(0,123,255,.25); }
.sptc-campo--contorno { border: 2px solid #000; border-radius: 5px; padding: 5px; width: 70%; height: auto; }   /* .textarea-borda */
label { font-size: 16px; font-weight: 400; color: var(--sptc-texto); }

/* ---------- Abas [BS4] ---------- */
.sptc-conteudo .sptc-abas,
.sptc-abas { display: flex; list-style: none; margin: 0; padding: 0 0 0 19px; border-bottom: 3px solid var(--sptc-borda); }  /* o seletor duplo vence a regra de lista de .sptc-conteudo ul */
.sptc-abas li { list-style: none; } /* no site a linha das abas mede ~3px, mais grossa que o 1px padrão do BS4 */
.sptc-abas a { display: block; padding: 8px 16px; color: var(--sptc-tab-inativa); border: 1px solid transparent; border-radius: 4px 4px 0 0; text-decoration: none; }
.sptc-abas a h5 { margin: 0; font-size: 20px; }
.sptc-abas a.is-ativa { color: var(--sptc-tab-ativa); background: #FFF; border-color: var(--sptc-borda) var(--sptc-borda) #FFF; }

/* ---------- Tabelas [BS4 .table-bordered] ---------- */
.sptc-tabela { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid var(--sptc-borda); }
.sptc-tabela th, .sptc-tabela td { padding: 12px; border: 1px solid var(--sptc-borda); text-align: left; }
.sptc-tabela th { font-weight: 700; }

/* ---------- Alertas [BS4] ---------- */
.sptc-alerta-info { color: var(--sptc-info-texto); background: var(--sptc-info-fundo); border: 1px solid var(--sptc-info-borda); border-radius: var(--sptc-raio); padding: 12px 20px; }

/* ---------- Cards ---------- */
.sptc-card-contorno { margin: 50px 0; padding: 30px; border: 2px solid var(--sptc-borda-escura); border-radius: var(--sptc-raio-card); }  /* editais */
.sptc-card-contorno__titulo { font-size: 1.5rem; font-weight: bold; margin-bottom: .75rem; }
.sptc-passo { display: flex; align-items: center; position: relative; margin: 50px 0; border: 2px solid #000; border-radius: var(--sptc-raio-card); font-weight: bold; }
.sptc-passo__numero { width: 160px; height: 160px; border-radius: 50%; background: var(--sptc-vermelho); color: #FFF; font-size: 60pt; line-height: 130px; text-align: center; padding: 10px; }
.sptc-card-autoridade { width: 350px; padding: 10px; text-align: center; background: rgba(233,233,233,.83); border-radius: var(--sptc-raio-card-lg); }
.sptc-card-autoridade img { width: 100%; height: 400px; object-fit: cover; object-position: center top; border-radius: 35px 35px 0 0; }
.sptc-card-autoridade__nome { margin: 10px 0; font-weight: bold; color: var(--sptc-vermelho); }
.sptc-card-autoridade__cargo { margin: 10px 0; font-weight: bold; font-size: 12pt; }
.sptc-faq__pergunta { cursor: pointer; font-size: 1.4em; color: #040404; }
.sptc-faq__resposta { padding: 10px; color: #000; line-height: 1.4em; }

/* ---------- Rodapé ---------- */
.sptc-faixa-gov { background: var(--sptc-fundo-faixa); }
.sptc-rodape { background: var(--sptc-rodape); color: var(--sptc-fundo-faixa); padding: 40px; font-size: 12pt; }
.sptc-rodape h5 { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px; }
.sptc-rodape a, .sptc-rodape a:hover { color: var(--sptc-fundo-faixa); }
```

---

## 11. Esqueleto HTML de referência

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nome do Sistema — Polícia Científica do Estado de São Paulo</title>
  <link rel="icon" href="logos/sptc-favicon.png">
  <link rel="stylesheet" href="sptc-theme.css">
</head>
<body>
  <div class="sptc-pagina">
    <nav class="sptc-navbar">
      <img class="sptc-navbar__brasao" src="logos/sptc-brasao-2024.png"
           alt="Polícia Científica do Estado de São Paulo">
      <a href="#">Institucional</a>
      <a href="#">Serviços</a>
      <a href="#">Transparência</a>
      <span class="sptc-navbar__social"></span>
    </nav>

    <main class="sptc-conteudo">
      <span class="sptc-titulo">Título da página</span>

      <ul class="sptc-abas">
        <li><a class="is-ativa" href="#"><h5>Aba 1</h5></a></li>
        <li><a href="#"><h5>Aba 2</h5></a></li>
      </ul>

      <form>
        <label for="q">Rótulo do campo</label>
        <input id="q" class="sptc-campo" type="text">
        <button class="sptc-btn sptc-btn--acao" type="submit">Pesquisar</button>
      </form>

      <div class="sptc-alerta-info">Mensagem informativa.</div>

      <table class="sptc-tabela">
        <thead><tr><th>Coluna</th><th>Coluna</th></tr></thead>
        <tbody><tr><td>Valor</td><td>Valor</td></tr></tbody>
      </table>

      <div class="sptc-card-contorno">
        <div class="sptc-card-contorno__titulo">Título do card</div>
        <p>Conteúdo.</p>
      </div>
    </main>

    <section class="sptc-faixa-gov"></section>

    <footer class="sptc-rodape">
      <h5>Sistemas</h5>
      <a href="#">Link</a>
    </footer>
  </div>
</body>
</html>
```

---

## 12. Checklist de conformidade

- [ ] Barra de navegação `#2F65B1` de 88 px, fixa ao rolar
- [ ] Filete vermelho `#AB0000` de 5 px sob a barra
- [ ] Distintivo ultrapassando a borda inferior da barra
- [ ] Menu e títulos de página em CAIXA ALTA
- [ ] Botão primário `#2F65B1` ou `#034EA2` — nenhum `#007BFF` sobrou
- [ ] Botão de ação `#C00606`, com hover definido
- [ ] Dois regimes de raio preservados (4–5 px e 25–35 px / pill)
- [ ] Corpo de texto em 16 px
- [ ] Aba inativa mais escura que `#A3A3A3`
- [ ] Botão de download com contraste corrigido
- [ ] Uma única versão do Bootstrap carregada
- [ ] Sem `nowrap` + `break-all` nos títulos
- [ ] `z-index` da barra abaixo do de modais
- [ ] Tabela com zebra e hover definidos
- [ ] Foco visível em todo elemento interativo
- [ ] Manual oficial obtido e conferido antes de fechar requisitos

---

## 13. Procedência de cada dado

| Seção | Confiabilidade |
|---|---|
| Cores, tipografia, componentes, layout | **Alta.** Lidos de `/css/custom.css` e de estilos computados, com conferência visual em duas páginas. |
| Cores do distintivo | **Média.** Medidas pixel a pixel no PNG; sujeitas a confirmação no manual oficial. |
| Contrastes | **Alta.** Calculados pela fórmula WCAG. |
| Composição da tela de consulta de laudos | **Alta.** Página lida diretamente (sem preencher nem enviar nada). |
| Paleta oficial, tipografia oficial, regras do brasão | **Ausente.** O manual não pôde ser lido. |
| Nomes de tokens e classes | Convenção deste documento, não do site. |

**Fontes:** [Portal SPTC](https://www.policiacientifica.sp.gov.br/) · [custom.css](https://www.policiacientifica.sp.gov.br/css/custom.css?v=1) · [Funções e Competências](https://www.policiacientifica.sp.gov.br/funcoes) · [Identidade Visual](https://www.policiacientifica.sp.gov.br/identidade-visual) · [Manual em PDF — não lido](https://www.policiacientifica.sp.gov.br/images/pilares/identidade_visual.pdf) · [Consulta de Laudos](https://www.policiacientifica.sp.gov.br/laudos/consulta)
