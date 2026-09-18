# Identidade Visual — Polícia Militar do Estado de São Paulo (PMESP)

> **O que é este arquivo.** Especificação de identidade visual da PMESP, escrita como instrução direta para um assistente de IA (Claude Code, Cursor, etc.) gerar telas e sistemas já no padrão visual da Corporação. É autocontido: contém os tokens, as regras, o CSS pronto e um esqueleto HTML. Basta anexar ou colar este arquivo inteiro junto com o pedido do sistema.
>
> **Procedência.** Extraído do portal https://www.policiamilitar.sp.gov.br/ em 17/09/2026, lendo `/Content/pmesp.css` (811 regras) e os estilos computados no navegador a 1366 px, na home e na página interna "Brasão de Armas", com conferência visual por screenshot. **Não existe manual de identidade visual oficial publicado no portal** (procurei nos menus; não é uma busca exaustiva). Portanto este documento descreve *o que o site faz*, e não uma norma da Corporação. Se o CComSoc fornecer um manual, ele prevalece sobre tudo aqui.
>
> **Nomes inventados.** Os nomes de tokens (`--pm-*`) e de classes (`.pm-*`) são convenção deste documento, não do site. A coluna "origem no site" de cada tabela diz de onde veio cada valor.

---

## 0. Regras inegociáveis

Ao gerar qualquer tela para a PMESP, o assistente DEVE:

1. **Usar cantos retos.** `border-radius: 0` em botões, campos, tabelas, modais e cards. Esta é a característica mais forte do padrão — arredondar descaracteriza. Únicas exceções previstas: botão pill coral (100 px), botão de painel da área restrita (8 px) e botão circular de fechar (50 %).
2. **Usar o grafite `#333335` como cor estrutural** (cabeçalho, cabeçalho de tabela, botões neutros) e o vermelho apenas como acento — nunca como fundo de área grande.
3. **Colocar o filete vermelho `#FF0E18` de 3 px sob o cabeçalho.** É a assinatura visual do portal.
4. **Não usar sombras** em botões, cards ou campos. O único sombreamento previsto é o halo azul de foco.
5. **Escrever menu e rótulos de botão em CAIXA ALTA.**
6. **Usar `#006699` para links em texto corrido**, e não o `#2E92CF` do site — ver seção 6, o azul do site reprova em contraste.
7. **Manter foco visível** (`:focus-visible` com contorno). O site remove o contorno de foco em vários pontos; isso é defeito, não padrão.
8. **Nunca redesenhar, recolorir, inclinar ou distorcer o logotipo.** Ver seção 8.

---

## 1. A identidade em uma frase

Institucional, sóbria e "dura": blocos grafite escuros, filetes vermelhos finos como acento, conteúdo sobre branco, geometria retangular sem sombras nem gradientes, tipografia em Arial com caixa alta na navegação.

---

## 2. Tokens de cor

Copie o bloco `:root` da seção 9. A tabela abaixo explica cada token.

### 2.1 Estruturais (grafites)

| Token | Hex | Onde o site usa |
|---|---|---|
| `--pm-grafite` | `#333335` | Fundo do cabeçalho, blocos de atalho, cabeçalho de tabela, botões neutros, paginação ativa |
| `--pm-grafite-claro` | `#424243` | Faixa superior do cabeçalho (acessibilidade, redes, "Serviços ao PM") |
| `--pm-grafite-borda` | `#505050` | Borda inferior de 2 px da faixa superior |
| `--pm-grafite-divisor` | `#5F5F5F` | Divisor vertical de 3 px entre itens do menu |
| `--pm-rodape` | `#323332` | Fundo do rodapé |
| `--pm-rodape-social` | `#252625` | Faixa de redes sociais no rodapé |
| `--pm-rodape-link` | `#BDBDBD` | Links do rodapé |

### 2.2 Vermelhos (acento de marca)

| Token | Hex | Onde o site usa |
|---|---|---|
| `--pm-vermelho-linha` | `#FF0E18` | Filete de 3 px sob o cabeçalho e sob o mega-menu |
| `--pm-vermelho-tijolo` | `#B72A04` | Botão primário (confirmar/entrar); borda esquerda de 3 px do mega-menu |
| `--pm-vermelho-vinho` | `#930403` | Botão de conteúdo ("leia mais"), links de destaque |
| `--pm-vermelho-forte` | `#BF0000` | Botão enviar; hover do botão fechar de modal |
| `--pm-vermelho-fechar` | `#CE0104` | Botão circular de fechar |
| `--pm-vermelho-tabela` | `#9A2400` | Cabeçalho alternativo de tabela |
| `--pm-coral` | `#E84B4B` | Linha ao lado de título de seção; botão pill |

### 2.3 Azuis, secundárias e feedback

| Token | Hex | Onde o site usa |
|---|---|---|
| `--pm-azul` | `#006699` | Seção de estatísticas, foco de campo, indicador ativo do carrossel |
| `--pm-azul-escuro` | `#004F7D` | Variação |
| `--pm-azul-videos` | `#19374C` | Botão da seção de vídeos (hover `#09131A`) |
| `--pm-link` | `#2E92CF` | Cor de link do site (hover `#57BDF1`, active `#81CEF4`) — **substituir por `#006699` em texto corrido** |
| `--pm-verde` | `#145735` | Bloco "Atividades culturais" (hover `#0A2D1B`) |
| `--pm-ouro` | `#876C00` | Bloco "Atividades comunitárias" (hover `#574601`) |
| `--pm-sucesso` | `#1DA446` | Sucesso; fundo `#EBFDE5`, texto `#136C2E` |
| `--pm-erro` | `#FF0000` | Erro; botão fechar de modal |
| `--pm-linha-selecionada` | `#FFFFAA` | Hover e linha selecionada em tabela |

### 2.4 Texto e neutros

| Token | Hex | Onde o site usa |
|---|---|---|
| `--pm-texto` | `#333333` | Texto base (`body`) |
| `--pm-texto-paragrafo` | `#3E4650` | Parágrafos de conteúdo |
| `--pm-texto-lista` | `#6F6E6E` | Itens de lista em conteúdo |
| `--pm-titulo` | `#000000` | Título de página |
| `--pm-fundo-pagina` | `#F5F5F5` | Fundo do `html` |
| `--pm-fundo-secao` / `--pm-fundo-secao-2` | `#F7F7F7` / `#EDEDEC` | Seções de fundo claro |
| `--pm-zebra` | `#F3F3F3` | Linhas pares de tabela |
| `--pm-borda` / `--pm-borda-forte` | `#DDDDDD` / `#CCCCCC` | Bordas gerais / bordas de célula |
| `--pm-borda-campo` | `#A9A9A9` | Borda de campo de formulário |
| `--pm-botao-neutro` | `#E0E1E2` | Botão secundário |

### 2.5 Cores do logotipo (NÃO usar na interface)

Medidas pixel a pixel no arquivo `logos/pmesp-logo.png`: azul `#234485`, vermelho `#C20D19`, amarelo `#FFED00`, dourado de sombra da estrela `#B9A011`, mais preto e branco.

Atenção: o vermelho do logotipo (`#C20D19`) **não é** nenhum dos vermelhos da interface. Não tente "harmonizar" a UI com o logotipo trocando os hex — use os tokens da seção 2.2 na interface e deixe o logotipo com as cores dele.

---

## 3. Tipografia

**Família base:** `Arial, "Segoe UI", sans-serif`. Algumas áreas do site invertem para `"Segoe UI", Arial, sans-serif`; não é uma distinção significativa, use a primeira.

**Fonte de marca:** **Alternate Gothic No2 BT Regular**, usada exclusivamente no letreiro "POLÍCIA MILITAR DO ESTADO DE SÃO PAULO" ao lado do logotipo (25 px, branca, caixa alta, `line-height: 14px`). É fonte comercial da Bitstream; o arquivo `/fonts/AlternateGothicNo2BT-Regular.woff` existe no site mas **não deve ser copiado** — use o arquivo licenciado da Corporação. Fallback: `"Arial Narrow"`. Não use esta fonte em mais nada.

Montserrat e Open Sans aparecem carregadas na página, mas pertencem à barra do Governo de SP, não à PMESP.

| Elemento | Tamanho / linha | Peso | Cor | Observação |
|---|---|---|---|---|
| `body` | 14 px / 20 px | 400 | `#333333` | |
| `p` | 16 px / 24 px | 400 | `#3E4650` | margem inferior 10 px |
| `h1` | 26 px | 500 | | margem `0 0 20px` |
| `h2` | 22 px | 500 (700 em conteúdo) | | margem `0 0 14px` |
| `h3` / `h4` / `h5` | 18 / 16 / 14 px | 500 | | |
| Título de página | 26 px → **32 px** acima de 992 px, linha 35 px | bold | `#000000` | |
| Título de seção | 20 px | 700 | `#333333` | CAIXA ALTA + linha coral de 4 px à direita |
| Menu principal | 13 px | bold | `#FFFFFF` | CAIXA ALTA |
| Submenu | 14 px / 28 px | 400 | `#EEEEEE` | título de grupo 16 px branco |
| Rótulo de atalho | 11 px / 15,7 px | 400 | `#FFFFFF` | CAIXA ALTA |
| Label de formulário | 14 px | 400 | | |
| Tabela | 14 px | th 400 (não bold) | | altura de célula 32 px |
| Rodapé: título / link | 14 px (500) / 12 px | | `#FFFFFF` / `#BDBDBD` | |

---

## 4. Layout e grid

- **Framework de origem:** Bootstrap 3. Se for gerar com outro framework, replique: container de **1170 px**, gutter de 15 px, 12 colunas, breakpoints em **768 / 992 / 1200 px** (o site acrescenta ajustes pontuais em 1280 e 1920).
- **Ordem da página:** barra GovSP (externa) → cabeçalho grafite com filete vermelho → conteúdo em branco → seções alternadas (cinza claro / azul) → rodapé grafite → faixa de redes sociais → rodapé GovSP (externo).
- **Espaçamentos recorrentes:** 10, 15, 20, 30 e 45 px.
- **Responsivo:** sim, mobile-first. Abaixo de 992 px: logotipo cai para 45 px, letreiro e nome da secretaria são ocultados, menu vira hambúrguer, atalhos empilham, tabelas viram cartões (o site usa o plugin stacktable).

---

## 5. Componentes — regras de construção

### Cabeçalho
Fundo `#333335`, altura ~140 px no desktop, **borda inferior de 3 px `#FF0E18`**. Coluna esquerda (4/12): logotipo a 78 px de altura, letreiro em Alternate Gothic e, abaixo, "Secretaria da Segurança Pública" em 12 px. Coluna direita (8/12): faixa superior `#424243` de 52 px com borda inferior de 2 px `#505050`, contendo ícones sociais de 30×30 px e o link "Serviços ao PM" (14 px bold, branco, sublinhado no hover); abaixo dela, o menu.

### Menu principal e mega-menu
Itens inline, 13 px bold caixa alta branco, separados por **borda direita de 3 px `#5F5F5F`** (o último item não tem). Hover muda a cor do texto para `#666666` — ver ressalva de contraste na seção 6. O submenu é um mega-menu de largura total em 3 colunas, fundo `#333335`, **borda esquerda de 3 px `#B72A04` e borda inferior de 3 px `#FF0E18`**, títulos de grupo em 16 px branco e links em `#EEEEEE` com `line-height: 2em`.

### Título de seção
Texto 20 px bold caixa alta + linha horizontal de 4 px `#E84B4B` com `border-radius: 10px` ocupando o espaço restante à direita. Use flexbox.

### Botões
Sem borda, sem raio, sem sombra, transição de 0,3–0,5 s. Padding padrão 8×25 px.

| Variante | Fundo | Hover | Uso |
|---|---|---|---|
| Primário | `#B72A04` | `#333335` | Confirmar, entrar |
| Destaque | `#930403` | `#000000` | "Leia mais" em card de notícia |
| Enviar | `#BF0000` | — | Envio de formulário |
| Neutro | `#333335` | `#000000` | Detalhes, voltar (CAIXA ALTA, padding 5×15 px) |
| Secundário | `#E0E1E2` texto preto | `#CCCCCC` | Ação alternativa |
| Contorno | branco, texto e borda `#B72A04` | — | Criar conta |
| Sucesso | `#1DA446` | — | Confirmação |
| Pill (exceção) | `#E84B4B`, raio 100 px, padding 10×30 px, 15 px caixa alta | — | Chamada destacada |

### Campos de formulário
Largura 100 %, altura mínima 32 px, padding 5×8 px, borda de 1 px `#A9A9A9`, **sem raio**, margem 5 px acima e 15 px abaixo. Foco: borda `#006699` + `box-shadow: 0 0 2px #006699`. Label acima, 14 px peso 400.

### Tabelas
Cabeçalho `#333335` (variante `#9A2400`), texto branco 14 px **peso normal**, altura 32 px, centralizado, sem borda. Linhas zebradas branco / `#F3F3F3`. Bordas de célula 1 px `#CCCCCC`; bordas laterais da tabela `#A7A7A7`. Hover e linha selecionada `#FFFFAA`. Links dentro da tabela em preto.

### Modais
Conteúdo branco, sem borda, sem raio, sem sombra, padding 15/30/30 px. Cabeçalho `#333333`, texto branco, `line-height: 39px`. Botão fechar de 30×30 px em `#FF0000` (hover `#BF0000`). Variante de sucesso: cabeçalho `#1DA446`, corpo `#EBFDE5` com borda `#1DA446` e texto `#136C2E`.

### Cards e atalhos
Blocos de atalho: fundo `#333335`, 123 px de altura, ícone branco acima de texto 11 px caixa alta, borda direita de 2 px `#666666`, borda superior de 3 px e inferior de 2 px `#F0F0F0`. Cards de notícia: imagem com sobreposição `rgba(0,0,0,.24)`, título branco 16 px, margem 10 px.

### Rodapé
Fundo `#323332`. Colunas com título 14 px peso 500 branco e links 12 px `#BDBDBD`. Faixa de redes sociais `#252625` de 50 px com borda superior `#272928`.

---

## 6. Acessibilidade — onde o site erra e o que fazer

O portal oferece links de salto, alto contraste e ajuste de fonte pela barra GovSP. Mas três coisas reprovam na WCAG AA e **não devem ser copiadas**:

| Combinação | Contraste | Situação |
|---|---|---|
| `#2E92CF` sobre branco (link) | 3,43:1 | **Reprova.** Use `#006699` (6,25:1) em texto corrido |
| `#666666` sobre `#333335` (hover do menu) | 2,20:1 | **Reprova.** Use branco com sublinhado, ou clarear para `#B0B0B0` |
| branco sobre `#E84B4B` (botão pill) | 3,79:1 | Só serve para texto ≥ 18,66 px bold |
| branco sobre `#B72A04` (botão primário) | 6,28:1 | Aprova |
| `#BDBDBD` sobre `#323332` (rodapé) | 6,75:1 | Aprova |
| `#006699` sobre branco | 6,25:1 | Aprova |

Além disso: o site remove o contorno de foco em vários seletores. **Mantenha foco visível** em todo elemento interativo.

---

## 7. Ativos de marca

Arquivos já baixados, na pasta `logos/` (e em `logos-policias-sp.zip`):

| Arquivo | Origem | Formato | Como usar |
|---|---|---|---|
| `logos/pmesp-logo.png` | `/images/logo_policiamilitar_high.png` | PNG 1965×1685, RGBA transparente, 321 KB | Logotipo do cabeçalho (exibir a 78 px de altura). **Tem contorno branco e sombra projetada embutidos na imagem**, feitos para fundo escuro. Em fundo branco a sombra vira mancha cinza — nesse caso peça o original sem sombra. |
| `logos/pmesp-brasao-de-armas.jpg` | `/images/internas/brasao-de-armas.jpg` | JPEG 334×299, fundo branco | Brasão de Armas (bandeirante + soldado, lema "Lealdade e Constância"). Baixa resolução, sem transparência: só para referência ou uso pequeno sobre branco. |
| `logos/pmesp-favicon.ico` | `/images/favicon.ico` | ICO, 5 tamanhos (16–64 px) | Favicon |
| `logos/pmesp-apple-touch-icon.png` | `/images/apple-touch-icon.png` | PNG 180×180 RGBA | Ícone de atalho em celular |

**Logotipo ≠ Brasão de Armas.** O logotipo é o emblema com a estrela e as faixas, usado no cabeçalho. O Brasão de Armas é a peça heráldica com o bandeirante e o soldado, que aparece só na página institucional. Não troque um pelo outro.

**Não disponível no site:** versão vetorial (SVG/AI/EPS/PDF), versão monocromática, versão negativa, e a fonte licenciada. Para impressão, telas de alta densidade ou fundo claro, solicite os originais ao **CComSoc (Centro de Comunicação Social da PMESP)**.

---

## 8. Restrições legais e proibições

- O uso do logotipo e do Brasão de Armas da PMESP é **regulado por norma interna da Corporação**. Se o sistema não for da própria PMESP, obtenha autorização formal antes de aplicar a marca.
- Não redesenhe, recolora, incline, distorça, recorte nem adicione elementos ao logotipo.
- Não gere uma "versão nova" ou "modernizada" da marca.
- A barra superior e o rodapé do Governo de São Paulo são componentes externos: se o sistema for público, inclua-os pelos scripts oficiais do Governo (`saopaulo.sp.gov.br/barra-govsp/`), não os recrie.

---

## 9. CSS pronto

Salve como `pmesp-theme.css` e importe antes do seu CSS de aplicação. Os comentários marcam o que veio do site e o que é estimativa.

```css
/* ==========================================================================
   PMESP — tema base extraído de https://www.policiamilitar.sp.gov.br/
   Fonte: /Content/pmesp.css (811 regras) + estilos computados em 1366px.
   Extraído em 17/09/2026. Valores são os do site; nomes de tokens são nossos.
   Base do site: Bootstrap 3 + jQuery 1.9 (grid de 12 colunas, container 1170px).
   ========================================================================== */

/* Fonte de display usada só no letreiro "POLÍCIA MILITAR DO ESTADO DE SÃO PAULO".
   É uma fonte comercial (Bitstream). Use o arquivo licenciado da própria PMESP. */
@font-face {
  font-family: "AlternateGothicNo2BT-Regular";
  font-weight: normal;
  font-style: normal;
  src: url("../fonts/AlternateGothicNo2BT-Regular.woff") format("woff"),
       url("../fonts/AlternateGothicNo2BT-Regular.ttf") format("truetype");
}

:root {
  /* --- Marca / estrutura --- */
  --pm-grafite:          #333335; /* header, atalhos, th de tabela, botões neutros */
  --pm-grafite-claro:    #424243; /* faixa superior do header (.top) */
  --pm-grafite-borda:    #505050; /* borda inferior da faixa superior */
  --pm-grafite-divisor:  #5F5F5F; /* divisor vertical entre itens do menu */
  --pm-rodape:           #323332; /* fundo do rodapé */
  --pm-rodape-social:    #252625; /* faixa de redes sociais do rodapé */
  --pm-rodape-link:      #BDBDBD;

  /* --- Vermelhos (cor de destaque da marca) --- */
  --pm-vermelho-linha:   #FF0E18; /* filete sob o header e sob o submenu */
  --pm-vermelho-tijolo:  #B72A04; /* botão primário (.btn-red, .btn-confirmar), borda do submenu */
  --pm-vermelho-vinho:   #930403; /* botão de conteúdo ("leia mais"), links de destaque */
  --pm-vermelho-forte:   #BF0000; /* .btn-enviar, hover do fechar de modal */
  --pm-vermelho-fechar:  #CE0104;
  --pm-vermelho-tabela:  #9A2400; /* th alternativo de tabela */
  --pm-coral:            #E84B4B; /* separador de título de seção e botão pill */

  /* --- Azuis --- */
  --pm-azul:             #006699; /* seção de números, foco de campo, paginação ativa do carrossel */
  --pm-azul-escuro:      #004F7D;
  --pm-azul-videos:      #19374C;
  --pm-link:             #2E92CF;
  --pm-link-hover:       #57BDF1;
  --pm-link-active:      #81CEF4;

  /* --- Secundárias por seção --- */
  --pm-verde:            #145735; /* atividades culturais */
  --pm-verde-hover:      #0A2D1B;
  --pm-ouro:             #876C00; /* atividades comunitárias */
  --pm-ouro-hover:       #574601;

  /* --- Feedback --- */
  --pm-sucesso:          #1DA446;
  --pm-sucesso-fundo:    #EBFDE5;
  --pm-sucesso-texto:    #136C2E;
  --pm-erro:             #FF0000;
  --pm-linha-selecionada:#FFFFAA; /* hover / linha selecionada em tabela */

  /* --- Texto e neutros --- */
  --pm-texto:            #333333; /* body */
  --pm-texto-paragrafo:  #3E4650; /* <p> de conteúdo */
  --pm-texto-lista:      #6F6E6E;
  --pm-texto-suave:      #666666;
  --pm-titulo:           #000000;
  --pm-branco:           #FFFFFF;
  --pm-fundo-pagina:     #F5F5F5; /* html */
  --pm-fundo-secao:      #F7F7F7;
  --pm-fundo-secao-2:    #EDEDEC;
  --pm-zebra:            #F3F3F3;
  --pm-borda:            #DDDDDD;
  --pm-borda-forte:      #CCCCCC;
  --pm-borda-campo:      #A9A9A9;
  --pm-botao-neutro:     #E0E1E2;

  /* --- Tipografia --- */
  --pm-font-base:    Arial, "Segoe UI", sans-serif;
  --pm-font-ui:      "Segoe UI", Arial, sans-serif;
  --pm-font-display: "AlternateGothicNo2BT-Regular", "Arial Narrow", Arial, sans-serif;

  --pm-fs-xs: 12px;
  --pm-fs-sm: 13px;   /* itens do menu principal */
  --pm-fs-base: 14px; /* body, label, tabela */
  --pm-fs-md: 16px;   /* parágrafo */
  --pm-fs-lg: 18px;
  --pm-fs-xl: 20px;   /* título de seção / card */
  --pm-fs-h2: 22px;
  --pm-fs-h1: 26px;   /* 32px em telas largas para .tituloSecao */

  /* --- Forma --- */
  --pm-raio: 0;            /* padrão do site: cantos retos */
  --pm-raio-suave: 4px;    /* poucos casos (inputs de busca) */
  --pm-raio-pill: 100px;   /* botão pill coral */
  --pm-transicao: .3s;
  --pm-container: 1170px;

  /* --- Breakpoints (Bootstrap 3) --- 768 / 992 / 1200 (+1280 e 1920 em ajustes) */
}

/* ---------- Base ---------- */
html { background: var(--pm-fundo-pagina); position: relative; min-height: 100%; }
body {
  font-family: var(--pm-font-base);
  font-size: var(--pm-fs-base);
  line-height: 20px;
  color: var(--pm-texto);
  background: var(--pm-branco);
  margin: 0;
}
h1 { font-size: 26px; margin: 0 0 20px; }
h2 { font-size: 22px; margin: 0 0 14px; }
h3 { font-size: 18px; margin: 10px 0; }
h4 { font-size: 16px; margin: 0 0 10px; }
h5 { font-size: 14px; margin: 0 0 10px; }
p  { font-size: 16px; line-height: 24px; margin: 0 0 10px; color: var(--pm-texto-paragrafo); }
label { font-weight: 400; font-size: 14px; }
img { max-width: 100%; }
a { color: var(--pm-link); text-decoration: none; cursor: pointer; }
a:hover  { color: var(--pm-link-hover); }
a:active { color: var(--pm-link-active); }
blockquote {
  border-left: 5px solid var(--pm-borda); color: var(--pm-texto-suave);
  font-style: italic; line-height: 2.5; padding-left: 1.5em; margin: 1em 40px; font-size: 14px;
}
blockquote:hover { border-left-color: var(--pm-azul); }

.pm-container { max-width: var(--pm-container); margin: 0 auto; padding: 0 15px; }

/* ---------- Header ---------- */
.pm-header {
  background: var(--pm-grafite);
  border-bottom: 3px solid var(--pm-vermelho-linha);
  color: var(--pm-branco);
  position: relative; z-index: 99;
}
.pm-header__top {                 /* faixa superior: acessibilidade, redes, "Serviços ao PM" */
  background: var(--pm-grafite-claro);
  border-bottom: 2px solid var(--pm-grafite-borda);
  min-height: 52px; padding-left: 40px;
}
.pm-header__top a { color: var(--pm-branco); font-weight: 700; font-size: 14px; }
.pm-header__top a:hover { text-decoration: underline; }

.pm-logo { display: inline-block; text-align: center; color: var(--pm-branco); margin: 10px 0 5px; }
.pm-logo img, .pm-logo svg { height: 78px; width: auto; }   /* 45px no mobile */
.pm-logo__slogan {
  font-family: var(--pm-font-display);
  font-size: 25px; line-height: 14px; padding-top: 21px; margin: 0 0 10px;
  text-transform: uppercase; color: var(--pm-branco);
}
.pm-logo__secretaria { font-size: 12px; line-height: 16px; color: var(--pm-branco); margin: 0 0 10px; }

/* ---------- Menu principal ---------- */
.pm-menu > ul { list-style: none; margin: 0 auto 10px; padding: 0; }
.pm-menu > ul > li {
  display: inline-block; padding: 0 8px 0 5px;
  border-right: 3px solid var(--pm-grafite-divisor);
}
.pm-menu > ul > li:last-child { border-right: 0; padding-right: 0; }
.pm-menu > ul > li > a {
  font-size: 13px; font-weight: bold; color: var(--pm-branco);
  text-transform: uppercase; display: inline-block;
}
.pm-menu > ul > li > a:hover { color: var(--pm-texto-suave); }
.pm-menu__sub {                     /* mega-menu em 3 colunas */
  display: none; position: absolute; left: 0; width: 100%;
  background: var(--pm-grafite);
  border-left: 3px solid var(--pm-vermelho-tijolo);
  border-bottom: 3px solid var(--pm-vermelho-linha);
  padding: 20px 15px;
}
.pm-menu li.is-open > .pm-menu__sub { display: block; }
.pm-menu__sub a { color: #EEEEEE; line-height: 2em; padding-left: 10px; font-size: 14px; }
.pm-menu__sub .pm-menu__grupo { color: var(--pm-branco); font-size: 16px; line-height: 22px; padding-bottom: 10px; display: block; }

/* ---------- Títulos de página e de seção ---------- */
.pm-titulo-pagina {                  /* .tituloSecao */
  color: var(--pm-titulo); font-weight: bold; font-size: 26px; line-height: 35px; margin: 30px 0 10px;
}
@media (min-width: 992px) { .pm-titulo-pagina { font-size: 32px; } }

.pm-titulo-secao { display: flex; align-items: center; }
.pm-titulo-secao__texto { font-size: 20px; font-weight: 700; text-transform: uppercase; color: var(--pm-texto); white-space: nowrap; }
.pm-titulo-secao__linha { flex: 1; height: 4px; margin-left: 15px; border-radius: 10px; background: var(--pm-coral); }

.pm-breadcrumb { list-style: none; margin: 0; padding: 0; font-size: 14px; line-height: 34px; }
.pm-breadcrumb li { display: inline-block; color: #333334; font-weight: lighter; }
.pm-breadcrumb li + li::before { content: "> "; color: #000; font-weight: bold; }
.pm-breadcrumb li:last-child { font-weight: bold; }
.pm-breadcrumb a { color: #333334; }

.pm-conteudo h2 { margin: 30px 0 10px; font-weight: 700; color: var(--pm-texto); }
.pm-conteudo ul li { font-size: 16px; line-height: 2; color: var(--pm-texto-lista); margin-left: 16px; }

/* ---------- Botões (sempre cantos retos, sem borda, sem sombra) ---------- */
.pm-btn {
  display: inline-block; border: 0; border-radius: var(--pm-raio);
  padding: 8px 25px; font-family: inherit; font-size: 14px; text-align: center;
  color: var(--pm-branco); cursor: pointer; transition: background var(--pm-transicao), color var(--pm-transicao);
}
.pm-btn:hover { text-decoration: none; color: var(--pm-branco); }

.pm-btn--primario   { background: var(--pm-vermelho-tijolo); }          /* .btn-red / .btn-confirmar */
.pm-btn--primario:hover { background: var(--pm-grafite); }
.pm-btn--destaque   { background: var(--pm-vermelho-vinho); }           /* .conteudo-btn */
.pm-btn--destaque:hover { background: #000; }
.pm-btn--enviar     { background: var(--pm-vermelho-forte); padding: 6px 10px; }
.pm-btn--neutro     { background: var(--pm-grafite); text-transform: uppercase; padding: 5px 15px; } /* .btn-detalhes / .btn-voltar */
.pm-btn--neutro:hover { background: #000; }
.pm-btn--secundario { background: var(--pm-botao-neutro); color: #000; }  /* .btn-senha */
.pm-btn--secundario:hover { background: var(--pm-borda-forte); color: #000; }
.pm-btn--contorno   { background: var(--pm-branco); color: var(--pm-vermelho-tijolo); border: 1px solid var(--pm-vermelho-tijolo); padding: 6px 25px; } /* .btn-criar-conta */
.pm-btn--sucesso    { background: var(--pm-sucesso); min-width: 115px; }
.pm-btn--pill       { background: var(--pm-coral); border: 2px solid var(--pm-coral); border-radius: var(--pm-raio-pill); padding: 10px 30px; font-size: 15px; text-transform: uppercase; }
.pm-btn--bloco      { display: block; width: 100%; }

/* ---------- Formulários ---------- */
.pm-campo {                         /* .formField */
  display: block; width: 100%; min-height: 32px;
  margin: 5px 0 15px; padding: 5px 8px;
  border: 1px solid var(--pm-borda-campo); border-radius: var(--pm-raio);
  box-sizing: border-box; font: inherit; color: var(--pm-texto); background: var(--pm-branco);
}
.pm-campo:focus { outline: 0; border-color: var(--pm-azul); box-shadow: 0 0 2px var(--pm-azul); }
textarea.pm-campo { height: auto; }

/* ---------- Tabelas ---------- */
.pm-tabela { width: 100%; border-collapse: collapse; border-left: 1px solid #A7A7A7; border-right: 1px solid #A7A7A7; }
.pm-tabela th {
  background: var(--pm-grafite); color: var(--pm-branco); font-weight: normal;
  height: 32px; font-size: 14px; padding: 0 5px; text-align: center; border: 0;
}
.pm-tabela--vermelha th { background: var(--pm-vermelho-tabela); padding: 10px 5px; }
.pm-tabela td {
  height: 32px; font-size: 14px; padding: 0 5px; text-align: center;
  border-bottom: 1px solid var(--pm-borda-forte); border-right: 1px solid var(--pm-borda-forte);
}
.pm-tabela tr:nth-child(2n)   { background: var(--pm-zebra); }
.pm-tabela tr:nth-child(2n+1) { background: var(--pm-branco); }
.pm-tabela tr:hover, .pm-tabela tr.is-selecionada { background: var(--pm-linha-selecionada); }
.pm-tabela a { color: #000; }

.pm-paginacao a {
  float: left; padding: 6px 12px; color: var(--pm-grafite);
  border: 1px solid var(--pm-borda); border-left: 0; border-radius: 0;
}
.pm-paginacao a:first-child { border-left: 1px solid var(--pm-borda); }
.pm-paginacao a.is-atual { background: var(--pm-grafite); border-color: var(--pm-grafite); color: var(--pm-branco); }

/* ---------- Modais ---------- */
.pm-modal__conteudo { background: var(--pm-branco); border: 0; border-radius: 0; box-shadow: none; padding: 15px 30px 30px; }
.pm-modal__cabecalho { background: var(--pm-texto); color: var(--pm-branco); line-height: 39px; padding-left: 15px; }
.pm-modal__fechar { float: right; width: 30px; height: 30px; margin: 3px; line-height: 30px; font-size: 18px; text-align: center; color: var(--pm-branco); background: var(--pm-erro); border: 0; }
.pm-modal__fechar:hover { background: var(--pm-vermelho-forte); }
.pm-modal--sucesso .pm-modal__cabecalho { background: var(--pm-sucesso); }
.pm-modal--sucesso .pm-modal__corpo { background: var(--pm-sucesso-fundo); border: 1px solid var(--pm-sucesso); color: var(--pm-sucesso-texto); }

/* ---------- Cards / atalhos ---------- */
.pm-atalho {                        /* blocos escuros de atalho da home */
  background: var(--pm-grafite); color: var(--pm-branco); text-align: center;
  padding: 17px 10px; font-size: 11px; text-transform: uppercase;
  border-top: 3px solid var(--pm-grafite); border-right: 2px solid var(--pm-texto-suave); border-bottom: 2px solid #F0F0F0;
}
.pm-atalho a { color: var(--pm-branco); }
.pm-painel-btn {                    /* a.btn-painel — botões de painel da área restrita */
  border: 1px solid var(--pm-borda); border-radius: 8px; color: #353443;
  text-transform: uppercase; transition: .5s; background: linear-gradient(#fff, #f3f3f3);
}
.pm-painel-btn:hover { background: var(--pm-branco); text-decoration: none; }
.pm-card-noticia { position: relative; margin: 10px; background: rgba(0,0,0,.24); }
.pm-card-noticia__titulo { color: var(--pm-branco); font-size: 16px; line-height: 23px; }

/* ---------- Seções de fundo ---------- */
.pm-secao--azul  { background: var(--pm-azul); color: var(--pm-branco); }
.pm-secao--cinza { background: var(--pm-fundo-secao-2); padding: 45px 0; }
.pm-secao--clara { background: var(--pm-fundo-secao); }

/* ---------- Rodapé ---------- */
.pm-rodape { background: var(--pm-rodape); color: var(--pm-branco); }
.pm-rodape h6 { font-size: 14px; font-weight: 500; margin: 10px 0 15px; color: var(--pm-branco); }
.pm-rodape a, .pm-rodape a:hover { color: var(--pm-rodape-link); font-size: 12px; }
.pm-rodape__social { background: var(--pm-rodape-social); border-top: 1px solid #272928; }
```

---

## 10. Esqueleto HTML de referência

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nome do Sistema — Polícia Militar do Estado de São Paulo</title>
  <link rel="icon" href="logos/pmesp-favicon.ico">
  <link rel="stylesheet" href="pmesp-theme.css">
</head>
<body>
  <header class="pm-header">
    <div class="pm-header__top">
      <div class="pm-container"><a href="#">Serviços ao PM</a></div>
    </div>
    <div class="pm-container">
      <div class="pm-logo">
        <img src="logos/pmesp-logo.png" alt="Polícia Militar do Estado de São Paulo">
        <p class="pm-logo__slogan">Polícia Militar do Estado de São Paulo</p>
        <p class="pm-logo__secretaria">Secretaria da Segurança Pública</p>
      </div>
      <nav class="pm-menu">
        <ul>
          <li><a href="#">Início</a></li>
          <li><a href="#">Consultas</a></li>
          <li><a href="#">Relatórios</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="pm-container">
    <h1 class="pm-titulo-pagina">Título da página</h1>

    <div class="pm-titulo-secao">
      <span class="pm-titulo-secao__texto">Seção</span>
      <span class="pm-titulo-secao__linha"></span>
    </div>

    <form>
      <label for="q">Rótulo do campo</label>
      <input id="q" class="pm-campo" type="text">
      <button class="pm-btn pm-btn--primario" type="submit">Confirmar</button>
      <button class="pm-btn pm-btn--secundario" type="button">Cancelar</button>
    </form>

    <table class="pm-tabela">
      <thead><tr><th>Coluna</th><th>Coluna</th></tr></thead>
      <tbody><tr><td>Valor</td><td>Valor</td></tr></tbody>
    </table>
  </main>

  <footer class="pm-rodape">
    <div class="pm-container">
      <h6>Título da coluna</h6>
      <ul><li><a href="#">Link</a></li></ul>
    </div>
    <div class="pm-rodape__social"></div>
  </footer>
</body>
</html>
```

---

## 11. Checklist de conformidade

Antes de entregar uma tela, confira:

- [ ] Filete vermelho `#FF0E18` de 3 px sob o cabeçalho
- [ ] Cabeçalho `#333335`; faixa superior `#424243` quando houver
- [ ] `border-radius: 0` em botões, campos, tabelas e modais
- [ ] Nenhuma sombra fora do halo de foco
- [ ] Menu e rótulos de botão em CAIXA ALTA
- [ ] Botão primário `#B72A04`; nenhum botão azul de framework sobrou
- [ ] Links de texto em `#006699`, não `#2E92CF`
- [ ] Cabeçalho de tabela `#333335` com texto branco peso normal; zebra `#F3F3F3`
- [ ] Campo com borda `#A9A9A9` e foco `#006699`
- [ ] Foco visível em todo elemento interativo
- [ ] Logotipo sem deformação, a 78 px de altura no cabeçalho
- [ ] Container de 1170 px; layout íntegro a 768 px
- [ ] Título de página 32 px bold preto no desktop

---

## 12. Procedência de cada dado

| Seção | Confiabilidade |
|---|---|
| Cores, tipografia, componentes | **Alta.** Lidos de `/Content/pmesp.css` e de estilos computados no navegador. |
| Layout e responsividade | **Alta** para valores de CSS; a checagem visual foi feita só em desktop (1366 px) e em duas páginas. |
| Cores do logotipo | **Alta.** Medidas pixel a pixel no PNG baixado. |
| Contrastes | **Alta.** Calculados pela fórmula WCAG. |
| Botões de painel da área restrita | **Média.** Lidos só do CSS, sem ver renderizados (área exige login). |
| "Não há manual oficial" | **Média.** Não encontrei nos menus do portal; não é uma busca exaustiva nem consulta ao CComSoc. |
| Nomes de tokens e classes | Convenção deste documento, não do site. |

**Fontes:** [Portal PMESP](https://www.policiamilitar.sp.gov.br/) · [pmesp.css](https://www.policiamilitar.sp.gov.br/Content/pmesp.css) · [Brasão de Armas](https://www.policiamilitar.sp.gov.br/institucional/brasao-de-armas)
