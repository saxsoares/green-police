# Identidade Visual — Polícia Civil do Estado de São Paulo (PCSP)

> **O que é este arquivo.** Especificação de identidade visual da Polícia Civil de SP, escrita como instrução direta para um assistente de IA (Claude Code, Cursor, etc.) gerar telas e sistemas no padrão da Instituição. É autocontido: tokens, regras, CSS pronto e esqueleto HTML. Anexe ou cole este arquivo inteiro junto com o pedido do sistema.
>
> **Esta é a única das três polícias de SP com manual oficial legível.** A PCSP publica um **Manual de Identidade Visual (MIV)**, revisão de julho/2025, 56 páginas, elaborado pela Assistência Policial de Comunicação Social (APCS/DGPAd). Ele foi lido na íntegra e é a base das seções 0 a 9 deste documento. O arquivo está em `manual-identidade-visual-PCSP-jul2025.pdf`.
>
> **O portal público NÃO segue o manual.** O site policiacivil.sp.gov.br é de geração anterior (Oracle WebCenter + Bootstrap 2, layout fixo de 940 px) e usa uma paleta diferente da oficial. Ele está documentado na seção 10 apenas como referência histórica. **Para qualquer sistema novo, siga o manual (seções 0–9), não o portal.**

---

## 0. Regras inegociáveis

Ao gerar qualquer tela para a Polícia Civil, o assistente DEVE:

1. **Usar o vermelho oficial `#ED1C24`** (Pantone 485 C). Não use `#CC0000` (portal antigo) nem `#FF0000` (ilustração do manual).
2. **Usar o brasão colorido.** Em tela, o manual prevê **apenas a versão colorida**. Monocromática e negativa têm uso restrito a materiais físicos (seção 6).
3. **Nunca alterar o brasão:** não remover texto, não inclinar, não mudar cores, não alterar proporções, não separar os elementos gráficos dos textuais, não incorporar outros elementos. Lista completa na seção 6.
4. **Respeitar a margem de segurança** de 1 módulo "x" em toda a volta do brasão (seção 6).
5. **Seguir o modelo de tela de sistema policial da página 16 do manual** (seção 5) quando for uma tela de login ou o cabeçalho de um sistema interno. Este é o único padrão de interface que o manual define, e ele é explícito quanto a se aplicar a sistemas policiais.
6. **Usar Arial** em toda a interface; **Arial Black** apenas nos dizeres do brasão e no nome do sistema na faixa vermelha.
7. **Não aplicar o brasão sobre fundo que prejudique a leitura.**

---

## 1. A identidade em uma frase

Escudo dourado com brasão do Estado ao centro, sobre base branca; vermelho vivo `#ED1C24` como única cor de ação; preto e as listras da bandeira paulista como elemento gráfico de transição; tipografia Arial, sem ornamento.

---

## 2. Base normativa

- Brasão regulamentado pela **Portaria DGP nº 92, de 21/10/2019**.
- Segue a padronização nacional da **Resolução nº 01/2017 do CONCPC** (Conselho Nacional de Chefes de Polícia Civil), que uniformiza o emblema de todas as polícias civis do país.
- Brasão de Armas histórico: **Decreto nº 13.459, de 10/04/1979**, art. 2º.
- Distintivos policiais: **Portaria DGP nº 02, de 20/01/2021**.
- Direitos de propriedade sobre o brasão: **independem de registro**, conforme art. 124, IV, da Lei nº 9.279/1996.
- Uso indevido é crime: **art. 296, §1º, III, do Código Penal** — reclusão de 2 a 6 anos e multa (aviso publicado na própria página de Comunicação Social do portal).

**Descrição oficial do emblema** (manual, p. 6): o brasão compõe o centro de um escudo dourado, com faixa superior contendo a palavra POLÍCIA e faixa inferior contendo a palavra CIVIL; abaixo do listel inferior, a sigla SP.

---

## 3. Paleta oficial

Do manual, página 10. O manual fornece os quatro padrões (CMYK para impresso, RGB para tela, Pantone para cor especial, hexadecimal para web).

| Cor | Hex | RGB | CMYK | Pantone | Token |
|---|---|---|---|---|---|
| Vermelho | `#ED1C24` | 237; 28; 36 | 0; 100; 100; 0 | 485 C | `--pc-oficial-vermelho` |
| Preto | `#222222` | 35; 31; 32 | 0; 0; 0; 100 | Neutral Black C | `--pc-oficial-preto` |
| Verde | `#009A4E` | 0; 154; 78 | 100; 10; 100; 0 | 7482 C | `--pc-oficial-verde` |
| Branco | `#FFFFFF` | 255; 255; 255 | 0; 0; 0; 0 | Trans White | — |
| Amarelo fundo (escudo) | `#BFA659` | 190; 165; 90 | 0; 10; 39; 25 | 465 C | `--pc-oficial-dourado-fundo` |
| Amarelo faixa | `#B09440` | 175; 147; 64 | 0; 11; 44; 31 | 618 C | `--pc-oficial-dourado-faixa` |
| Amarelo detalhe da faixa | `#C2B066` | 194; 176; 102 | 0; 7; 35; 24 | 465 C | `--pc-oficial-dourado-detalhe` |
| Cinza da versão negativa | `#939598` | 147; 149; 152 | 0; 0; 0; 50 | Cool Gray 7 C | `--pc-oficial-cinza-negativo` |

**Erro no manual:** na linha "amarelo detalhe faixa", o manual imprime RGB 255; 255; 255 ao lado do hex `#C2B066`. É erro de digitação dele — `#C2B066` corresponde a RGB 194; 176; 102, que é o valor correto e coerente com o CMYK dado. Use o hex.

**Cores complementares da tela de sistema** (medidas por mim na ilustração da p. 16; o manual não as declara em texto): caixa de login `#E6E6E6`, borda de campo `#B3B3B3`, marca d'água do brasão `#CCCCCC`.

---

## 4. Tipografia

Do manual, página 9.

| Uso | Fonte | Observação |
|---|---|---|
| Dizeres "POLÍCIA" e "CIVIL" nas faixas do escudo e a sigla "SP" | **Arial Black** | Padrão nacional obrigatório (Resolução CONCPC 01/2017) |
| Assinatura tipográfica | **Arial Black** | "POLÍCIA CIVIL" com "S Ã O  P A U L O" espaçado abaixo |
| Nome do sistema na faixa vermelha | **Arial Black** | Branco, alinhado à direita |
| Documentos oficiais | **Arial** ou **Times New Roman** | 14 para títulos, 12 para corpo |
| Interface, papelaria, apresentações | **Arial** | |
| Placas de sinalização interna | **Futura Bold** | Uso físico apenas |

Não há fonte proprietária. Não substitua Arial por Helvetica, Inter ou similares em peças oficiais.

---

## 5. Tela-padrão de sistema policial

**Esta é a seção mais importante para um sistema novo.** O manual (p. 16) define um modelo de tela e lista expressamente os sistemas a que ele se aplica: Prodesp, Infocrim, Omega, Alpha, Phoenix, RDO, Cadastros, DTI/DIPOL, S-Protocolo, SISFROTA, WebMail, Necrim **e outros**.

**Composição, de cima para baixo:**

1. **Fundo branco** em toda a tela.
2. **Brasão colorido** no canto superior esquerdo, dentro da faixa de topo.
3. Imediatamente à direita do brasão, **duas faixas diagonais inclinadas para a direita** — uma preta e uma branca —, remetendo às listras da bandeira paulista. Elas fazem a transição para a faixa vermelha.
4. **Faixa vermelha horizontal** ocupando o restante do topo, com o **nome do sistema** em branco, Arial Black, alinhado à direita.
5. **Brasão em contorno cinza-claro `#CCCCCC` como marca d'água**, grande, sangrando pela borda direita da tela.
6. **Caixa de login centralizada**: fundo `#E6E6E6`, cantos levemente arredondados; rótulos "Login:" e "Senha:" acima de campos brancos com borda `#B3B3B3`; botão **"LOGIN"** vermelho, texto branco em caixa alta, centralizado.
7. **Rodapé centralizado**: "2019 - Polícia Civil do Estado de São Paulo" (no manual; atualize o ano conforme o caso).

O CSS da seção 11 implementa esse layout nas classes `.pc-sistema*`. **As medidas em pixels são estimativa minha**, porque o manual ilustra a tela mas não a cota. A composição e as cores são do manual.

O manual **não** define grid, breakpoints, responsividade, tabelas de dados, modais, estados de erro ou qualquer outro componente de sistema. Para tudo isso, escolha um padrão coerente e aplique a paleta da seção 3.

---

## 6. Regras de uso do brasão

**Margem de segurança** (p. 7–8). A malha construtiva define um módulo "x". A margem de segurança mínima em volta do brasão é de **1 módulo "x"** em todos os lados — nenhum outro elemento do layout pode invadir esse espaço.

**Redução mínima** (p. 13). A altura mínima de reprodução é **15 mm**. O manual não fornece equivalente em pixels; para tela, adote no mínimo ~56 px de altura (equivalente a 15 mm a 96 dpi) e prefira mais.

**Versões e onde cada uma pode ser usada:**

| Versão | Cor | Uso permitido |
|---|---|---|
| **Colorida** | paleta completa | Padrão. **É a única versão prevista para tela.** |
| Monocromática | preto `#222222` | Exclusivamente: impressão de envelopes tipo saco ou carta, e gravação em materiais sólidos (madeira, metal, jateamento, adesivação em vidro) |
| Negativa | cinza `#939598` | Exclusivamente: bordado discreto em capas de colete balístico |
| Contorno / marca d'água | `#CCCCCC` | Fundo da tela-padrão de sistema (p. 16) |

**Proibições explícitas** (p. 53–54):

- Não remover o texto nem qualquer outro elemento
- Não aplicar o emblema de forma inclinada
- Não alterar cores nem incorporar outros elementos gráficos ou textuais
- Não aplicar sobre fundos que atrapalhem a visibilidade
- Não alterar as proporções
- Não separar os elementos gráficos e textuais do emblema, seja em impressos ou em animações de vídeo

---

## 7. Acessibilidade — atenção ao vermelho oficial

O manual define a paleta por critérios gráficos e **não trata de contraste em tela**. Calculei os valores pela fórmula WCAG:

| Combinação | Contraste | Situação |
|---|---|---|
| Branco sobre `#ED1C24` (vermelho oficial) | **4,38:1** | **Reprova** para texto normal (mínimo AA: 4,5:1). Aprova só para texto grande — ≥ 24 px, ou ≥ 18,66 px em negrito |
| `#ED1C24` sobre branco | 4,38:1 | Mesmo caso |
| Branco sobre `#222222` | 15,91:1 | Aprova |
| `#222222` sobre `#BFA659` (dourado do escudo) | 6,68:1 | Aprova |
| Branco sobre `#009A4E` | 3,66:1 | Reprova para texto normal |

**Consequência prática.** O botão "LOGIN" da tela-padrão tem texto pequeno em caixa alta sobre vermelho. Nessa medida ele reprova. Três saídas, em ordem de preferência:

1. Aumentar o texto do botão para ≥ 18,66 px em negrito, o que o coloca na faixa de "texto grande" e resolve sem mexer na cor.
2. Manter `#ED1C24` como cor de fundo do botão e escurecê-lo apenas no estado de foco/hover.
3. Usar `#ED1C24` só em elementos não textuais (faixas, filetes, ícones) e adotar `#222222` nos botões com texto pequeno.

Não recolora a marca para resolver contraste — a cor do brasão é normativa. A correção deve vir do tamanho e do peso do texto, ou da escolha de onde o vermelho é aplicado.

Mantenha foco visível em todo elemento interativo: o manual não trata disso e o portal antigo remove o contorno de foco em vários pontos.

---

## 8. Ativos de marca

Arquivos na pasta `logos/` (e em `logos-policias-sp.zip`):

| Arquivo | Origem | Formato | Como usar |
|---|---|---|---|
| **`logos/pcsp-brasao.svg`** | Manual, p. 6 ("Novo Emblema Oficial") | SVG vetorial, 115 caminhos, fundo transparente | **Use este.** É o brasão isolado, extraído diretamente do vetor do manual (o PDF foi gerado no CorelDRAW) — recorte da página e remoção dos demais elementos, sem redesenho. Escala para qualquer tamanho. |
| `logos/pcsp-brasao-2121x2800.png` | idem, renderizado a 600 dpi | PNG RGBA transparente | Quando SVG não for possível |
| `logos/pcsp-brasao-512px.png` | idem | PNG RGBA 388×512 | Cabeçalho |
| `logos/pcsp-brasao-128px.png` | idem | PNG RGBA 97×128 | Ícone |
| **`logos/pcsp-brasao-contorno.svg`** | derivado do SVG acima | SVG, traço `#CCCCCC` de 1,1 px, sem preenchimento | **Marca d'água** da tela-padrão de sistema (seção 5). Derivei do vetor do manual trocando os preenchimentos por traço; conferi que o resultado reproduz a marca d'água ilustrada na p. 16. |
| `logos/pcsp-banner-site.png` | `/portal/imagens/logo.png` | PNG 512×118, **sem transparência**, fundo branco | É o **banner do cabeçalho do portal** (brasão + "Secretaria da Segurança Pública" + nome por extenso), não o logo. Baixa resolução. Mantido só como referência. |
| `logos/pcsp-favicon.ico` | `/portal/imagens/favicon.ico` | ICO 16×16 | Favicon do portal. O caminho declarado no HTML (`/imagens/favicon.ico`) retorna 404; este é o que responde. |
| `manual-identidade-visual-PCSP-jul2025.pdf` | Portal → Institucional → Comunicação Social | PDF vetorial, 56 páginas, 19 MB | O manual completo |

**Arquivos abertos e editáveis.** O manual informa na página 2 uma pasta pública com os arquivos abertos de todos os materiais: https://drive.google.com/drive/folders/15Zgi-tIE3nRw4wfoXw0pJh6EH2ILXBrK?usp=sharing — **não acessei esta pasta**. É a fonte preferível para o brasão em formato editável, para a versão em contorno usada como marca d'água e para os modelos de papelaria.

---

## 9. Restrições legais

O uso indevido de marcas, logotipos, siglas ou quaisquer outros símbolos da Polícia Civil do Estado de São Paulo **configura crime**, apenado com reclusão de 2 a 6 anos e multa (art. 296, §1º, III, do Código Penal). O aviso é do próprio portal, na página de Comunicação Social. Os direitos sobre o brasão independem de registro (art. 124, IV, da Lei nº 9.279/1996).

Se o sistema não for da própria Polícia Civil, **formalize a autorização de uso do brasão com a APCS/DGPAd antes de aplicá-lo.**

---

## 10. O portal público (referência histórica — não seguir)

O site policiacivil.sp.gov.br não segue o manual. Documento aqui o que ele faz, para o caso de você precisar manter ou integrar algo nele. **Não use esta seção como base para sistema novo.**

**Stack:** Oracle WebCenter Portal / ADF Faces 11g (daí as URLs `/portal/faces/...` e as classes ofuscadas `.x1cv`, `.xfu`, que são do framework e não fazem parte da identidade), Bootstrap 2 customizado, jQuery 1.9, Font Awesome 5. Layout **fixo em 940 px, não responsivo** — nem `estilo.css` nem o `bootstrap.css` do portal têm media query de tela, só de impressão. Páginas internas usam duas colunas: menu lateral de 220 px e conteúdo de 700 px.

**Cores do portal** (diferentes das oficiais):

| Token | Hex | Uso |
|---|---|---|
| `--pc-vermelho` | `#CC0000` | Título de página e seu filete, hover dos círculos, faixa de alerta |
| `--pc-vermelho-claro` | `#CC3333` | Hover de link, item de menu ativo, topo do gradiente do botão |
| `--pc-vermelho-escuro` | `#992626` | Faixa "Delegacia Eletrônica" |
| `--pc-preto-menu` → `--pc-preto` | `#222222` → `#111111` | Gradiente da barra de navegação; `#111111` no rodapé |
| `--pc-azul-noite` | `#25283C` | Faixa de subtítulo (h5) |
| `--pc-azul-destaque` | `#004087` | Chapéu de notícia |
| `--pc-texto` | `#333333` | Texto base **e cor padrão dos links** |
| `--pc-texto-suave` | `#666666` | Breadcrumb, menu lateral, fundo do item ativo |
| `--pc-borda` / `--pc-borda-clara` | `#CCCCCC` / `#DDDDDD` | Bordas |
| `--pc-borda-campo` | `#9297A6` | Borda de campo |
| `--pc-fundo-suave` | `#F5F5F5` | Caixa de login, bloco de órgão |
| Erro | `#B94A48` sobre `#F2DEDE`, borda `#EED3D7` | Padrão Bootstrap 2 |

**Características do portal:** base clara (cabeçalho branco com o banner, barra preta fina de 40 px abaixo, conteúdo branco, rodapé preto); links na cor do texto sem sublinhado, com hover vermelho; cantos de 4 px; botões com gradiente vertical sutil e `text-shadow`; títulos com tracking -0,04em; navegação da home por círculos com ícone de 76 px e submenu em balão de raio 30 px; menu lateral empilhado nas páginas internas com item ativo `#666666`.

**Contrastes do portal:** `#CC0000` sobre branco 5,89:1 (aprova), `#CC3333` 5,14:1 (aprova), `#666666` 5,74:1 (aprova), `#999999` sobre `#111111` 6,63:1 (aprova). Único reprovado: texto de erro `#B94A48` sobre `#F2DEDE`, 3,94:1.

**Defeitos do portal que não devem ser reproduzidos:** logo e vários títulos são imagens com o texto escondido por `text-indent`; links sem sublinhado e da mesma cor do texto ficam indistinguíveis dentro de parágrafos; o submenu dos círculos só abre por hover, inacessível por teclado e por toque; não há padrão de tabela de dados.

---

## 11. CSS pronto

Salve como `pcsp-theme.css`. O bloco `:root` traz **duas** famílias de tokens: `--pc-oficial-*` (manual, use estes) e `--pc-*` (portal antigo, referência). As classes `.pc-sistema*` implementam a tela-padrão da seção 5.

```css
/* ==========================================================================
   Polícia Civil SP — tema base extraído de https://www.policiacivil.sp.gov.br/
   Fonte: /portal/css/estilo.css (368 regras) + /portal/bootstrap/css/bootstrap.css
   (Bootstrap 2 customizado) + estilos computados a 1366px. Extraído em 17/09/2026.
   Valores são os do site; nomes de tokens e classes .pc-* são convenção nossa.
   O portal roda em Oracle WebCenter/ADF: as classes ofuscadas (.x1cv, .xfu...)
   são geradas pelo framework e NÃO fazem parte da identidade.
   ========================================================================== */

:root {
  /* --- Marca --- */
  --pc-vermelho:         #CC0000; /* título de página + filete, hover dos círculos, h5 de alerta */
  --pc-vermelho-claro:   #CC3333; /* hover de link, item ativo de menu, topo do gradiente do botão */
  --pc-vermelho-escuro:  #992626; /* faixa "Delegacia Eletrônica" */
  --pc-preto-menu:       #222222; /* topo do gradiente da barra de navegação */
  --pc-preto:            #111111; /* base do gradiente da barra e fundo do rodapé */
  --pc-azul-noite:       #25283C; /* faixa de subtítulo (h5) */
  --pc-azul-destaque:    #004087; /* chapéu/categoria de notícia */
  /* --- Paleta OFICIAL do Manual de Identidade Visual da PCSP (rev. jul/2025, p. 10).
         Prevalece sobre as cores do portal acima; para sistema novo, prefira estas. --- */
  --pc-oficial-vermelho:       #ED1C24; /* Pantone 485 C */
  --pc-oficial-preto:          #222222; /* Pantone Neutral Black C */
  --pc-oficial-verde:          #009A4E; /* Pantone 7482 C */
  --pc-oficial-dourado-fundo:  #BFA659; /* Pantone 465 C — escudo */
  --pc-oficial-dourado-faixa:  #B09440; /* Pantone 618 C */
  --pc-oficial-dourado-detalhe:#C2B066;
  --pc-oficial-cinza-negativo: #939598; /* Pantone Cool Gray 7 C */
  /* Tela-padrão de sistema policial (manual p. 16) — medido na ilustração: */
  --pc-sistema-caixa-login:    #E6E6E6;
  --pc-sistema-borda-campo:    #B3B3B3;
  --pc-sistema-marca-dagua:    #CCCCCC;

  /* --- Texto e neutros --- */
  --pc-texto:            #333333;
  --pc-texto-suave:      #666666; /* breadcrumb, menu lateral, títulos de painel */
  --pc-texto-campo:      #555555;
  --pc-cinza-medio:      #999999;
  --pc-borda:            #CCCCCC;
  --pc-borda-clara:      #DDDDDD;
  --pc-borda-campo:      #9297A6;
  --pc-fundo:            #FFFFFF;
  --pc-fundo-suave:      #F5F5F5; /* painéis, caixa de login, bloco de órgão */
  --pc-fundo-hover:      #F2F2F2; /* hover de linha de tabela */
  --pc-fundo-faixa:      #F7F7F7; /* faixa de links antes do rodapé */
  --pc-rodape-titulo:    #FFFFFF;
  --pc-rodape-link:      #DDDDDD;
  --pc-rodape-link-2:    #999999;
  --pc-rodape-texto:     #F2F2F2;

  /* --- Feedback (padrão Bootstrap 2) --- */
  --pc-erro-texto:       #B94A48;
  --pc-erro-fundo:       #F2DEDE;
  --pc-erro-borda:       #EED3D7;
  --pc-sucesso:          #5BB75B;
  --pc-info:             #49AFCD;
  --pc-aviso:            #FAA732;
  --pc-primario-azul:    #006DCC;

  /* --- Tipografia --- */
  --pc-font: Arial, Verdana, Helvetica, sans-serif;
  --pc-fs-xs: 12px;   /* breadcrumb, chapéu, rodapé institucional */
  --pc-fs-sm: 13px;   /* links do rodapé, dropdown */
  --pc-fs-base: 14px; /* body, p, botões, campos */
  --pc-fs-md: 16px;
  --pc-fs-lg: 18px;   /* h3–h5, título de notícia */
  --pc-fs-xl: 24px;   /* h1, h2 */
  --pc-tracking-titulo: -0.04em;

  /* --- Forma --- */
  --pc-raio: 4px;          /* padrão: botões, campos, caixas, alertas */
  --pc-raio-painel: 5px;
  --pc-raio-dropdown: 30px;
  --pc-sombra-caixa: 0 1px 2px rgba(0,0,0,.05);
  --pc-sombra-barra: 0 1px 10px rgba(0,0,0,.1);
  --pc-sombra-dropdown: 0 8px 16px rgba(0,0,0,.2);
  --pc-sombra-campo: inset 0 1px 2px rgba(0,0,0,.1), 0 1px 0 rgba(255,255,255,.15);
  --pc-transicao: .2s ease-in-out;
  --pc-container: 940px;   /* layout fixo; colunas 220px (menu) + 700px (conteúdo) */
}

/* ---------- Base ---------- */
* { margin: 0; padding: 0; }
html { font-family: var(--pc-font); font-size: 100.01%; height: 100%; }
body { font-family: var(--pc-font); font-size: 14px; color: var(--pc-texto); background: var(--pc-fundo); }
p { font-size: 14px; line-height: 22px; margin-bottom: 10px; }
a { color: var(--pc-texto); text-decoration: none; }
a:hover, a:focus { color: var(--pc-vermelho-claro); text-decoration: underline; }
img { border: 0; }
.pc-container { width: var(--pc-container); max-width: 100%; margin: 0 auto; }

/* ---------- Cabeçalho: fundo BRANCO com o logo, barra preta abaixo ---------- */
.pc-banner { background: var(--pc-fundo); border-bottom: 1px solid #EEEEEE; margin-bottom: 0; }
.pc-banner .pc-container { margin-bottom: 15px; }
.pc-logo { display: block; float: left; width: 590px; height: 120px; background: no-repeat left center / contain; text-indent: -999em; }
.pc-banner__acoes { float: right; margin-top: 35px; }        /* redes sociais + contraste + VLibras */
.pc-banner__acoes a { display: block; float: left; width: 45px; height: 45px; margin-left: 10px; }

.pc-navbar {
  min-height: 40px; padding: 0 20px;
  background: var(--pc-preto-menu) linear-gradient(var(--pc-preto-menu), var(--pc-preto));
  box-shadow: var(--pc-sombra-barra);
}
/* ATENÇÃO: hoje a barra preta do portal só contém a busca. As regras de link abaixo vêm de
   #nav-main no estilo.css (hover/ativo #CC3333), que não está em uso na home; o padding é estimativa nossa. */
.pc-navbar a { color: #FFFFFF; display: inline-block; padding: 10px 15px; transition: var(--pc-transicao); }
.pc-navbar a:hover, .pc-navbar .is-ativo > a { background: var(--pc-vermelho-claro); text-decoration: none; }
.pc-navbar input[type="search"], .pc-navbar input[type="text"] {
  background: #FFF; border: 1px solid var(--pc-borda); border-radius: var(--pc-raio);
  padding: 4px 6px; font-size: 14px; line-height: 20px; color: var(--pc-texto-campo);
  box-shadow: var(--pc-sombra-campo);
}

/* ---------- Barra de círculos (navegação principal da home) ---------- */
.pc-circulos { background: #EDEDED; border-bottom: 1px solid var(--pc-fundo-suave); padding: 20px 0; margin-bottom: 20px; } /* no site: textura clara HomeFundo.png */
.pc-circulos ul { list-style: none; display: flex; justify-content: center; }
.pc-circulos li { width: 172px; text-align: center; }
.pc-circulos img { display: block; width: 76px; height: 76px; margin: 0 auto 10px; }
.pc-circulos a { color: var(--pc-texto); font-size: 14px; font-weight: bold; line-height: 18px; text-decoration: none; }
.pc-circulos a:hover { color: var(--pc-vermelho); }
.pc-dropdown { position: relative; display: inline-block; }
.pc-dropdown__conteudo {
  display: none; position: absolute; z-index: 1; min-width: 160px; padding: 12px 16px;
  background: #F9F9F9; border-radius: var(--pc-raio-dropdown); box-shadow: var(--pc-sombra-dropdown);
}
.pc-dropdown:hover .pc-dropdown__conteudo { display: block; }
.pc-dropdown__conteudo li { list-style: none; width: 250px; text-align: left; border-bottom: 1px dotted var(--pc-cinza-medio); }
.pc-dropdown__conteudo a { font-size: 13px; font-weight: bold; line-height: 25px; color: var(--pc-texto); }

/* ---------- Títulos ---------- */
.pc-h1 { color: var(--pc-vermelho); font-size: 24px; font-weight: bold; letter-spacing: var(--pc-tracking-titulo); border-bottom: 1px solid var(--pc-vermelho); margin-bottom: 20px; }
.pc-h2 { font-size: 24px; font-weight: bold; line-height: 26px; letter-spacing: var(--pc-tracking-titulo); margin-bottom: 10px; }
.pc-h3 { font-size: 18px; font-weight: normal; letter-spacing: var(--pc-tracking-titulo); margin-bottom: 10px; }
.pc-h4 { font-size: 18px; font-weight: bold; line-height: 26px; letter-spacing: var(--pc-tracking-titulo); margin-bottom: 20px; }
.pc-h5 { background: var(--pc-azul-noite); color: #FFF; font-size: 18px; text-align: center; padding: 4px 0 3px; margin-bottom: 20px; }
.pc-h5--alerta { background: var(--pc-vermelho); }
.pc-h6 { font-size: 16px; font-weight: bold; letter-spacing: var(--pc-tracking-titulo); margin-bottom: 10px; }
.pc-h2--icone { font-size: 18px; line-height: 20px; text-transform: uppercase; }

/* ---------- Breadcrumb ---------- */
.pc-breadcrumb { list-style: none; color: var(--pc-texto-suave); font-size: 12px; line-height: 18px; margin-bottom: 15px; }
.pc-breadcrumb li { display: inline; }
.pc-breadcrumb a { color: var(--pc-texto-suave); text-decoration: underline; margin-right: 5px; }
.pc-breadcrumb a::after { content: " »"; }   /* no site o separador é uma imagem (bullet-right_dupla.gif); "»" é substituto nosso */

/* ---------- Menu lateral (220px) ---------- */
.pc-menu-lateral { list-style: none; width: 220px; }
.pc-menu-lateral a {
  display: block; padding: 8px 12px; font-size: 14px; line-height: 20px;
  color: var(--pc-texto-suave); border: 1px solid var(--pc-borda-clara); margin-top: -1px;
}
.pc-menu-lateral li:first-child a { border-radius: 4px 4px 0 0; margin-top: 0; }
.pc-menu-lateral li:last-child a { border-radius: 0 0 4px 4px; }
.pc-menu-lateral a:hover { background: #EEEEEE; text-decoration: none; }   /* hover = padrão do Bootstrap 2, não conferido no site */
.pc-menu-lateral .is-ativo a { background: var(--pc-texto-suave); color: #FFF; }

/* ---------- Botões (Bootstrap 2: gradiente sutil, raio 4px, text-shadow) ---------- */
.pc-btn {
  display: inline-block; padding: 4px 12px; font-size: 14px; line-height: 20px; text-align: center;
  color: var(--pc-texto); text-shadow: 0 1px 1px rgba(255,255,255,.75);
  background: #FFF; border: 1px solid var(--pc-borda); border-radius: var(--pc-raio); cursor: pointer;
}
.pc-btn--primario {            /* .btn-danger customizado — é o botão de ação do portal */
  color: #FFF; text-shadow: 0 -1px 0 rgba(0,0,0,.25);
  background: var(--pc-vermelho-claro) linear-gradient(var(--pc-vermelho-claro), var(--pc-vermelho));
  border-color: var(--pc-vermelho-claro);
}
.pc-btn--escuro  { color: #FFF; text-shadow: 0 -1px 0 rgba(0,0,0,.25); background: #363636 linear-gradient(#444444, #222222); border-color: rgba(0,0,0,.25); }
.pc-btn--azul    { color: #FFF; text-shadow: 0 -1px 0 rgba(0,0,0,.25); background: #006DCC linear-gradient(#0088CC, #0044CC); border-color: rgba(0,0,0,.25); }
.pc-btn--sucesso { color: #FFF; text-shadow: 0 -1px 0 rgba(0,0,0,.25); background: #5BB75B linear-gradient(#62C462, #51A351); border-color: rgba(0,0,0,.25); }
.pc-btn--info    { color: #FFF; text-shadow: 0 -1px 0 rgba(0,0,0,.25); background: #49AFCD linear-gradient(#5BC0DE, #2F96B4); border-color: rgba(0,0,0,.25); }
.pc-btn--aviso   { color: #FFF; text-shadow: 0 -1px 0 rgba(0,0,0,.25); background: #FAA732 linear-gradient(#FBB450, #F89406); border-color: rgba(0,0,0,.25); }

/* ---------- Formulários ---------- */
.pc-campo {
  display: inline-block; padding: 4px 6px; font: 14px/20px var(--pc-font); color: var(--pc-texto-campo);
  border: 1px solid var(--pc-borda-campo); border-radius: var(--pc-raio); vertical-align: middle; background: #FFF;
}
select.pc-campo { height: 30px; }
textarea.pc-campo { height: 110px; }
.pc-campo:focus { outline: 0; border-color: rgba(0,105,214,.6); box-shadow: 0 1px 4px rgba(0,105,214,.25); }
.pc-form-caixa {               /* .form-login */
  padding: 20px; margin: 0 auto 20px; background: var(--pc-fundo-suave);
  border: 1px solid var(--pc-borda-clara); border-radius: var(--pc-raio-painel); box-shadow: var(--pc-sombra-caixa);
}
.pc-form-caixa h2 { text-align: center; margin: 20px 0; }

/* ---------- Caixas, destaques, alertas ---------- */
.pc-box { border: 1px solid var(--pc-borda); border-radius: var(--pc-raio); padding: 10px 20px; }
.pc-box h2 { font-size: 24px; font-weight: bold; margin-bottom: 15px; }
.pc-destaque { border-bottom: 1px solid var(--pc-borda); padding-bottom: 3px; margin-bottom: 10px; }
.pc-destaque__chapeu { color: var(--pc-azul-destaque); font-size: 12px; margin-bottom: 5px; }
.pc-destaque a { color: #000; font-size: 14px; line-height: 20px; }
.pc-destaque a:hover { color: var(--pc-vermelho-claro); text-decoration: underline; }
.pc-noticia-titulo { font-size: 18px; line-height: 20px; font-weight: bold; }
.pc-orgao { background: var(--pc-fundo-suave); margin-bottom: 20px; }
.pc-alerta-erro {
  color: var(--pc-erro-texto); background: var(--pc-erro-fundo); border: 1px solid var(--pc-erro-borda);
  border-radius: var(--pc-raio); padding: 5px; text-align: center;
}

/* ---------- Tabelas (listagens de notícias) ---------- */
.pc-tabela { width: 100%; border-collapse: collapse; }
.pc-tabela td { border: 0; padding: 3px 5px; }
.pc-tabela thead td, .pc-tabela th { padding: 10px; font-weight: bold; text-align: left; }
.pc-tabela tbody tr:hover { background: var(--pc-fundo-hover); }

/* ---------- Paginação do carrossel ---------- */
.pc-slide-pag a { display: inline-block; width: 8px; height: 8px; margin: 2px; border-radius: 8px; background: var(--pc-borda); font-size: 0; }
.pc-slide-pag a.is-ativo { border: 2px solid var(--pc-texto-suave); }

/* ---------- Rodapé ---------- */
.pc-rodape-links { background: var(--pc-preto); padding: 30px 0 10px; }
.pc-rodape-links ul { list-style: none; border-left: 1px dotted #FFF; }
.pc-rodape-links a { font-size: 13px; line-height: 26px; color: var(--pc-rodape-link); padding-left: .6em; }
.pc-rodape-links a.pc-rodape-titulo { font-size: 14px; font-weight: bold; color: var(--pc-rodape-titulo); margin-bottom: 8px; display: inline-block; }
.pc-rodape { background: var(--pc-preto); text-align: center; padding: 20px 0; }
.pc-rodape h3 { font-size: 12px; color: var(--pc-borda); margin-bottom: 5px; text-transform: uppercase; }
.pc-rodape p { font-size: 14px; color: var(--pc-rodape-texto); margin-bottom: 5px; }
.pc-rodape li { list-style: none; display: inline; }
.pc-rodape li a { font-size: 14px; color: var(--pc-rodape-link-2); }
.pc-rodape li a:hover { text-decoration: underline; }
.pc-rodape li:first-child { border-right: 1px solid var(--pc-rodape-link-2); padding-right: 10px; margin-right: 10px; }

/* ==========================================================================
   TELA-PADRÃO DE SISTEMA POLICIAL — Manual de Identidade Visual PCSP, p. 16
   Estrutura descrita pelo manual; medidas em px são estimativa nossa a partir
   da ilustração (o manual não cota a tela).
   ========================================================================== */
.pc-sistema { min-height: 100vh; background: #FFF; position: relative; overflow: hidden; font-family: Arial, Helvetica, sans-serif; }
.pc-sistema__topo { display: flex; align-items: stretch; height: 96px; }
.pc-sistema__brasao { height: 96px; padding: 8px 24px; box-sizing: border-box; }               /* logos/pcsp-brasao.svg */
.pc-sistema__faixa {                                                                          /* diagonais preta e branca + faixa vermelha */
  flex: 1; display: flex; align-items: center; justify-content: flex-end; padding-right: 32px;
  color: #FFF; font-family: "Arial Black", Arial, sans-serif; font-size: 28px;
  background: linear-gradient(115deg, transparent 0 24px, var(--pc-oficial-preto) 24px 84px, #FFF 84px 112px, var(--pc-oficial-vermelho) 112px);
}
.pc-sistema__marca-dagua { position: absolute; right: -12%; top: 22%; width: 48%; opacity: 1; pointer-events: none; } /* brasão em contorno #CCCCCC */
.pc-sistema__login { width: 320px; margin: 12vh auto 0; padding: 24px; background: var(--pc-sistema-caixa-login); border-radius: 8px; position: relative; z-index: 1; }
.pc-sistema__login label { display: block; font-size: 12px; margin: 0 0 4px; }
.pc-sistema__login input { display: block; width: 100%; height: 30px; margin-bottom: 16px; border: 1px solid var(--pc-sistema-borda-campo); background: #FFF; box-sizing: border-box; }
.pc-sistema__login button { display: block; margin: 0 auto; padding: 6px 40px; border: 0; border-radius: 3px; background: var(--pc-oficial-vermelho); color: #FFF; font-weight: bold; font-size: 11px; text-transform: uppercase; cursor: pointer; }
.pc-sistema__rodape { position: absolute; bottom: 16px; width: 100%; text-align: center; font-size: 10px; color: var(--pc-oficial-preto); }
```

---

## 12. Esqueleto HTML — tela de login de sistema policial

Implementa o modelo da página 16 do manual.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nome do Sistema — Polícia Civil do Estado de São Paulo</title>
  <link rel="icon" href="logos/pcsp-favicon.ico">
  <link rel="stylesheet" href="pcsp-theme.css">
</head>
<body>
  <div class="pc-sistema">
    <div class="pc-sistema__topo">
      <img class="pc-sistema__brasao" src="logos/pcsp-brasao.svg"
           alt="Polícia Civil do Estado de São Paulo">
      <div class="pc-sistema__faixa">Nome do Sistema</div>
    </div>

    <!-- marca d'água: brasão em contorno #CCCCCC, sangrando pela direita -->
    <img class="pc-sistema__marca-dagua" src="logos/pcsp-brasao-contorno.svg" alt="" aria-hidden="true">

    <form class="pc-sistema__login" method="post">
      <label for="login">Login:</label>
      <input id="login" name="login" type="text" autocomplete="username">
      <label for="senha">Senha:</label>
      <input id="senha" name="senha" type="password" autocomplete="current-password">
      <button type="submit">Login</button>
    </form>

    <div class="pc-sistema__rodape">2026 - Polícia Civil do Estado de São Paulo</div>
  </div>
</body>
</html>
```

**Sobre a marca d'água:** `pcsp-brasao-contorno.svg` é derivação minha do vetor do manual (preenchimentos trocados por traço `#CCCCCC`), não um arquivo oficial. Visualmente reproduz a marca d'água da p. 16, mas se a pasta de arquivos abertos (seção 8) tiver a versão oficial em contorno, prefira aquela.

---

## 13. Checklist de conformidade

- [ ] Vermelho `#ED1C24` (oficial), não `#CC0000` nem `#FF0000`
- [ ] Brasão na versão **colorida** (tela nunca usa mono nem negativa)
- [ ] Brasão sem deformação, inclinação, recorte ou recoloração
- [ ] Margem de segurança de 1 módulo em volta do brasão
- [ ] Brasão com pelo menos ~56 px de altura (equivalente aos 15 mm mínimos)
- [ ] Faixa de topo: brasão → diagonais preta/branca → faixa vermelha com nome do sistema à direita
- [ ] Nome do sistema em Arial Black branco
- [ ] Caixa de login `#E6E6E6`, campos com borda `#B3B3B3`, botão "LOGIN" vermelho caixa alta
- [ ] Marca d'água do brasão em contorno `#CCCCCC` sangrando pela direita
- [ ] Rodapé centralizado com o nome da Instituição
- [ ] Arial em toda a interface; Arial Black só no brasão e no nome do sistema
- [ ] Texto branco sobre vermelho apenas em corpo grande (ver seção 7)
- [ ] Foco visível em todo elemento interativo
- [ ] Autorização de uso do brasão confirmada, se o sistema não for da PCSP

---

## 14. Procedência de cada dado

| Seção | Fonte | Confiabilidade |
|---|---|---|
| Paleta oficial, tipografia, regras do brasão, proibições, base normativa | Manual oficial jul/2025, lido na íntegra | **Alta** — é norma da Instituição |
| Composição da tela-padrão de sistema | Manual, p. 16 (ilustração + texto) | **Alta** para composição e cores |
| Medidas em px da tela-padrão no CSS | Estimativa minha a partir da ilustração | **Baixa** — o manual não cota a tela |
| Cores `#E6E6E6`, `#B3B3B3`, `#CCCCCC` | Medidas por mim na ilustração da p. 16 | **Média** — não declaradas em texto pelo manual |
| SVG do brasão | Extraído do vetor do próprio manual | **Alta** — sem redesenho; conferido renderizado sobre fundo colorido |
| SVG em contorno (marca d'água) | Derivação minha do SVG acima | **Média** — não é arquivo oficial; confere visualmente com a ilustração da p. 16 |
| Seção 9 (portal antigo) | `/portal/css/estilo.css`, `bootstrap.css` do portal e estilos computados a 1366 px | **Média/alta** para os valores de CSS. **Não houve conferência visual**: o navegador não conseguiu gerar screenshot do portal. |
| Contrastes (seção 7) | Calculados por mim pela fórmula WCAG; **o manual não trata de contraste** | **Alta** para o cálculo; a recomendação de correção é minha |
| Conteúdo da pasta de arquivos abertos (Google Drive) | Não acessada | — |

**Fontes:** [Manual de Identidade Visual PCSP](https://www.policiacivil.sp.gov.br/portal/ShowProperty?nodeId=/dipolContent/UCM_070464//idcPrimaryFile&) · [Comunicação Social — PCSP](https://www.policiacivil.sp.gov.br/portal/faces/pages_home/institucional/comunicacaoSocial) · [Portal PCSP](https://www.policiacivil.sp.gov.br/)
