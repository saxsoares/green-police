---
name: modelagem-propagacao
description: Referência de geodésia e modelagem física de propagação de incêndio no SIMIA-Verde — WGS84/UTM, azimute de vento, elipse de Alexander, Rothermel, back-tracking e GeoJSON. Use ao alterar geoCalculations.ts ou TacticalMapView, ao ajustar coeficiente do modelo, ou ao validar área, azimute, distância ou taxa de propagação.
---

# Modelagem de propagação e geodésia

Os números produzidos aqui vão para laudo pericial. Azimute invertido ou área inflada é erro
localizável pela Defesa.

## Módulo

[geoCalculations.ts](src/services/geoCalculations.ts):

| Função | Responsabilidade |
|---|---|
| `latLngToUtm(lat, lng)` | WGS84 → UTM (fuso, hemisfério, E, N) |
| `utmToLatLng(utm)` | UTM → WGS84 |
| `projectCoordinates(origem, azimute, distMetros)` | ponto projetado por rumo e distância |
| `generateFireEllipsePolygon(...)` | anel da elipse para Leaflet/GeoJSON |
| `modelFireSpread(params)` | motor: ROS, elipses T+1/3/6, risco, ressalva |
| `exportManchasGeoJson(...)` | exportação GeoJSON |
| `getQuadrantName(graus)` | azimute → N/NE/E/SE/S/SW/W/NW |

## Convenções inegociáveis

**Azimute do vento é a direção DE ONDE o vento sopra.** A propagação corre para
`(ventoDirecaoGraus + 180) % 360`. Vento de NW (315°) empurra o fogo para SE (135°). Esta inversão é
a fonte de erro número um do domínio — confira sempre que tocar em direção, inclusive na rosa dos
ventos da UI e no texto das diretrizes.

**Back-tracking** aponta a barlavento, contra a propagação, para o provável ponto de ignição. Ele
delimita um **quadrante provável**, nunca um ponto exato; o texto associado precisa dizer isso.

**Unidades no nome.** `ventoVelocidadeKmH`, `taxaPropagacaoMetrosHora`, `areaHectares`,
`distanciaMetrosFoco`. Converta na fronteira e rotule. Nunca uma variável `distancia` sem unidade.

**Datum.** Entrada e saída em WGS84; o laudo apresenta a projeção como SIRGAS 2000 (coincidentes na
precisão de interesse, mas o rótulo tem peso jurídico). O Brasil ocupa os fusos UTM **18 a 25, Sul**.

**Precisão.** 6 casas decimais (~0,1 m) em toda saída pericial.

## O modelo implementado

Elipse de propagação: Rothermel para a taxa, Alexander (1985) para a razão dos eixos.

```
baseRosMh        = 120 m/h (pastagem / vegetação média)
                 =  85 m/h (estágio Avançado ou Primário — mata densa retarda avanço rasteiro)
                 = 180 m/h (Cerrado, gramíneas secas, estágio Pioneiro)

windFactor       = (1 + max(0, vento_kmh) * 0.12) ^ 1.25
humidityFactor   = 2.4  se UR < 15%
                 = 1.8  se UR < 25%
                 = 1.4  se UR < 35%
                 = 0.65 se UR > 60%
                 = 1.0  caso contrário
tempFactor       = 1.25 se temperatura > 32 °C

headRateMetersHour = round(baseRosMh * windFactor * humidityFactor * tempFactor)
lengthWidthRatio   = max(1.15, 1 + 0.22 * max(1, vento_kmh) ^ 0.78)

backDistance     = forwardDistance * (0.10 + 0.05 / lengthWidthRatio)
majorAxis        = forwardDistance + backDistance
minorAxis        = majorAxis / lengthWidthRatio
área             = π * (majorAxis/2) * (minorAxis/2)
perímetro        = aproximação de Ramanujan
```

## Ao alterar

1. **Coeficiente novo exige proveniência em comentário** citando a fonte (Rothermel 1972,
   Alexander 1985, Byram 1959, manual do CBM). Sem citação é dado fabricado — proibido neste projeto.
2. **Sanidade dimensional.** Com ROS constante, a área cresce com o quadrado do tempo: T+6h ≈ 36× a
   área de T+1h; o perímetro cresce linearmente. Razão diferente indica bug.
3. **Casos-limite a verificar:** vento 0 km/h (elipse vira quase-círculo pelo piso 1.15 de
   `lengthWidthRatio`), UR 100 %, latitude negativa (todo o Brasil), cruzamento de fuso UTM,
   longitude −180, coordenada no mar.
4. **`nivelRisco`** (`BAIXO`/`MEDIO`/`ALTO`/`CRITICO`) deve ser monotônico: mais vento, menos umidade
   ou mais calor nunca reduzem o risco.
5. **`ressalvaForense` é obrigatória** em toda saída de `modelFireSpread` e precisa declarar as
   limitações reais: o modelo ignora declividade, heterogeneidade de combustível, barreiras naturais
   e ação de supressão. É projeção, não previsão.

## GeoJSON e Leaflet

- GeoJSON usa `[lng, lat]`; Leaflet usa `[lat, lng]`. **Trocar os dois é o bug clássico** — verifique
  explicitamente em cada conversão.
- Polígono válido: anel fechado (primeiro ponto = último), anel externo em sentido anti-horário.
- Em [TacticalMapView.tsx](src/components/views/TacticalMapView.tsx), camadas OSM (terreno) e Esri
  World Imagery (satélite). `useEffect` que cria mapa precisa de `map.remove()` na limpeza, senão
  vaza instância ao trocar de aba.
