---
description: Diagnóstico ao vivo de todos os conectores governamentais (SIPAM, INPE, NASA, IBGE, Open-Meteo, Overpass, DATAGEO)
argument-hint: "[coordenada opcional, ex: -21.1767,-47.8208]"
allowed-tools: Read, Grep, Bash, WebFetch
---

Verifique a saúde de todos os conectores governamentais do SIMIA-Verde.

Coordenada de teste: $ARGUMENTS
(Se vazia, use `-21.1767,-47.8208` — Ribeirão Preto/SP, dentro da cobertura do DATAGEO.)

## Procedimento

1. Verifique se o servidor está de pé em `http://localhost:3000`. Se não estiver, avise o usuário e
   pergunte se deve subir com `npm run dev` em background — não suba sem confirmação.

2. Com o servidor ativo, teste cada rota medindo tempo de resposta:

```bash
LAT=-21.1767; LNG=-47.8208
for r in \
  "/api/satellites/status" \
  "/api/sipam/status" \
  "/api/meteo?lat=$LAT&lng=$LNG" \
  "/api/focos-inpe?estado=SP" \
  "/api/sipam/eventos?uf=SP&dias=7" \
  "/api/sipam/evento-posicao?lat=$LAT&lng=$LNG" \
  "/api/ibge-estados" \
  "/api/ibge-municipios?uf=SP" \
  "/api/osm-overpass?lat=$LAT&lng=$LNG&raioMetros=3000" \
  "/api/sigamgeo-wfs?lat=$LAT&lng=$LNG" \
; do
  printf '%-55s ' "$r"
  curl -s -o /dev/null -w 'HTTP %{http_code}  %{time_total}s\n' --max-time 20 "http://localhost:3000$r"
done
```

3. Para cada rota que responder, inspecione o corpo e confirme que o **shape** bate com o que
   [apiConnectors.ts](src/services/apiConnectors.ts) espera. Um HTTP 200 com HTML de erro ou com
   schema alterado é falha silenciosa — órgãos brasileiros fazem isso sem aviso.

4. `/api/focos-nasa` só funciona com `NASA_FIRMS_MAP_KEY`. Confira se está no `.env`; se não estiver,
   registre como "não configurado", o que não é falha.

## Relatório

Tabela: `conector | órgão | HTTP | latência | shape OK? | diagnóstico`.

Depois:
- conectores **quebrados** (fora do ar, schema mudado, timeout recorrente) e o que fazer;
- conectores **degradados** (lentos, intermitentes, perto do limite de cota);
- se algum shape mudou, indique exatamente qual campo e onde o parser precisa ser ajustado.

Lembre o usuário: conector fora do ar é situação normal e prevista. A resposta correta do sistema é
marcar a camada como `INDISPONIVEL` com observação acionável — nunca preencher com valor plausível.
Se você encontrar código fazendo o contrário, isso é um achado crítico e deve constar do relatório.
