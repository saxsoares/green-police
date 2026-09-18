/**
 * Renderizador de Relatório Oficial do SIMIA-Verde (SENASP)
 * Conforme especificado na seção [A] — APRESENTAÇÃO do Plano de Execução.
 */

import { OcorrenciaCompleta } from '../types';
import { latLngToUtm } from './geoCalculations';

/**
 * Protege a célula de tabela Markdown: um `|` dentro do conteúdo quebra as colunas
 * e desalinha o laudo impresso.
 */
function celula(texto: string): string {
  return texto.replace(/\|/g, '·').replace(/\r?\n/g, ' ');
}

/** Campo não informado pela fonte nunca vira número: é declarado como tal. */
function ouNaoInformado(valor: number | string | undefined | null, sufixo = ''): string {
  if (valor === undefined || valor === null || valor === '') return '*não informado pela fonte*';
  if (typeof valor === 'number' && valor < 0) return '*não medido*';
  return `${valor}${sufixo}`;
}

export function renderRelatorioMarkdown(oc: OcorrenciaCompleta): string {
  const { input, contexto, meteo, projecao, diretrizes, forense, custodia, focosSat } = oc;
  const utm = latLngToUtm(input.coordenadas.lat, input.coordenadas.lng);

  return `# RELATÓRIO DE INTELIGÊNCIA GEOESPACIAL E INSTRUÇÃO FORENSE — QUEIMADAS
**SISTEMA INTEGRADO DE MONITORAMENTO E INTELIGÊNCIA AMBIENTAL (SIMIA-VERDE)**  
*Ministério da Justiça e Segurança Pública — Secretaria Nacional de Segurança Pública (SENASP)*

---

### [1] IDENTIFICAÇÃO E ENQUADRAMENTO DA OCORRÊNCIA
- **ID da Ocorrência:** \`${input.id}\`
- **Carimbo Temporal (UTC):** \`${input.timestampUtc}\`
- **Operador Responsável:** \`${input.operadorId}\`
- **Coordenadas Geográficas (WGS84):** \`${input.coordenadas.lat.toFixed(6)}, ${input.coordenadas.lng.toFixed(6)}\`
- **Referência Projetada (SIRGAS 2000 / UTM):** \`Zona ${utm.zone}${utm.hemisphere} | E: ${utm.easting} m | N: ${utm.northing} m\`
- **Município / UF:** ${input.municipio} - ${input.uf}
- **Comarca Judiciária:** ${input.comarca}
- **Detecção Inicial:** ${input.origemDescricao || 'Alerta de satélite de alta fidelidade'}
- **Autorização de Queimada (SEMIL/CETESB):** \`${input.autorizacaoQueimadaStatus}\`
  - *Detalhe:* ${input.autorizacaoQueimadaDetalhe}

---

### [2] ENRIQUECIMENTO GEOESPACIAL E CONTEXTO AMBIENTAL (SIGAMgeo / SEMIL-SP)
| Camada Analisada | Fonte Oficial | Situação / Atributos Relevantes | Confiabilidade |
|---|---|---|---|
| **Histórico de AIA** | ${celula(contexto.aia.fonte)} | ${celula(contexto.aia.confiabilidade === 'INDISPONIVEL' ? 'NÃO VERIFICADO — a consulta não foi realizada. A ausência de registro aqui NÃO atesta ausência de autuação anterior.' : contexto.aia.valor.historicoEncontrado ? `AUTUAÇÕES AMBIENTAIS NO ENTORNO (${contexto.aia.valor.quantidadeRegistros} no raio consultado): ${contexto.aia.valor.detalhes.map(d => `${d.numeroAia} (${d.dataAutuacao}) ${d.infracao}`).join('; ')}. Proximidade NÃO é reincidência — apurar o responsável pelos números de processo.` : 'A base respondeu à consulta e não retornou AIA prévio no ponto.')} | \`${contexto.aia.confiabilidade}\` |
| **Área de Preservação (APP)** | ${celula(contexto.app.fonte)} | ${celula(contexto.app.confiabilidade === 'INDISPONIVEL' ? 'NÃO VERIFICADA — consulta cartográfica indisponível.' : `${contexto.app.valor.tipoApp} Distância do foco à margem: ${ouNaoInformado(contexto.app.valor.distanciaMetros, ' m')}.`)} | \`${contexto.app.confiabilidade}\` |
| **Vegetação Nativa** | ${celula(contexto.vegetacaoNativa.fonte)} | ${celula(contexto.vegetacaoNativa.confiabilidade === 'INDISPONIVEL' ? 'NÃO VERIFICADA — sem integração com inventário de cobertura vegetal. Exige caracterização pericial in loco.' : `Bioma: ${contexto.vegetacaoNativa.valor.bioma} · Estágio sucessional: ${contexto.vegetacaoNativa.valor.estagioSucessional}`)} | \`${contexto.vegetacaoNativa.confiabilidade}\` |
| **Unidade de Conservação** | ${celula(contexto.unidadeConservacao.fonte)} | ${celula(contexto.unidadeConservacao.confiabilidade === 'INDISPONIVEL' ? 'NÃO VERIFICADA — incidência em UC não apurada. Verificar no CNUC/MMA: incidência em UC federal ou Terra Indígena atrai o Art. 40 da Lei 9.605/98 e a competência da Justiça Federal.' : contexto.unidadeConservacao.valor.afetada ? `INCIDÊNCIA DIRETA: ${contexto.unidadeConservacao.valor.nomeUC} (${contexto.unidadeConservacao.valor.distanciaKm} km)` : 'A base respondeu e não indicou incidência em perímetro de UC.')} | \`${contexto.unidadeConservacao.confiabilidade}\` |
| **Cadastro Rural (CAR)** | ${celula(contexto.car.fonte)} | ${celula(contexto.car.confiabilidade === 'INDISPONIVEL' ? 'NÃO VINCULADO — exige cruzamento com o SICAR pela autoridade policial.' : `Código: ${contexto.car.valor.codigoCar} · Status: ${contexto.car.valor.status} · Área: ${contexto.car.valor.areaPropriedadeHa} ha`)} | \`${contexto.car.confiabilidade}\` |

> **Leitura da coluna Confiabilidade:** \`REAL\` = a fonte respondeu e o dado provém dela.
> \`SIMULADO\` = saída de modelo matemático. \`INDISPONIVEL\` = **não foi possível verificar**:
> a camada não foi apurada e nenhuma conclusão pericial pode se apoiar nela.

- **Detecções Orbitais Próximas (NASA FIRMS / INPE BDQueimadas):**
${focosSat.map(f => `  - Sensor ${f.sensor} (${f.satelite}) — Detecção em: ${ouNaoInformado(f.dataHoraUtc)} — FRP: ${ouNaoInformado(f.frpMw, ' MW')} — Distância ao ponto: ${ouNaoInformado(f.distanciaMetrosFoco, ' m')} — ${f.confianca}`).join('\n')}

---

### [3] DINÂMICA METEOROLÓGICA E MODELAGEM DE PROPAGAÇÃO
- **Estação de Referência:** ${meteo.estacaoNome} (${meteo.estacaoDistanciaKm} km)
- **Vetor de Vento:** **${meteo.ventoVelocidadeKmH} km/h** procedente de **${meteo.ventoDirecaoTexto} (${meteo.ventoDirecaoGraus}°)**
- **Umidade Relativa do Ar (UR):** **${meteo.umidadeRelativaPercentual}%** *(Nível Crítico < 30%)*
- **Temperatura Ambiente / Pressão:** ${meteo.temperaturaCelsius} °C | ${meteo.pressaoHpa} hPa
- **Modelo de Propagação:** ${projecao.modeloBase}
- **Taxa de Avanço da Frente (Head Fire):** **${projecao.taxaPropagacaoMetrosHora} metros/hora**
- **Nível de Risco Operacional:** **[ ${projecao.nivelRisco} ]**

#### Projeção Elíptica de Queima Estimada
| Horizonte Temporal | Área Estimada (ha) | Perímetro (km) | Eixo Maior (m) | Azimute de Avanço |
|---|---|---|---|---|
| **T + 1 Hora** | **${projecao.manchas.t1h.areaHectares} ha** | ${projecao.manchas.t1h.perimetroKm} km | ${projecao.manchas.t1h.eixoMaiorMetros} m | ${projecao.manchas.t1h.azimutePropagacaoGraus}° (${meteo.ventoDirecaoTexto === 'NW' ? 'SE' : 'Sotavento'}) |
| **T + 3 Horas** | **${projecao.manchas.t3h.areaHectares} ha** | ${projecao.manchas.t3h.perimetroKm} km | ${projecao.manchas.t3h.eixoMaiorMetros} m | ${projecao.manchas.t3h.azimutePropagacaoGraus}° |
| **T + 6 Horas** | **${projecao.manchas.t6h.areaHectares} ha** | ${projecao.manchas.t6h.perimetroKm} km | ${projecao.manchas.t6h.eixoMaiorMetros} m | ${projecao.manchas.t6h.azimutePropagacaoGraus}° |

*Ressalva Forense:* ${projecao.ressalvaForense}

---

### [4] DIRETRIZES TÁTICAS MULTIAGÊNCIAS

#### A. Corpo de Bombeiros Militar (CBMSP)
- **Vetor de Avanço e Flancos:** ${diretrizes.bombeiros.vetorAvanco}
- **Pontos de Contenção Recomendados:**
${diretrizes.bombeiros.pontosContencao.map(p => `  - ${p}`).join('\n')}
- **Hidrografia e Mananciais de Abastecimento:**
${diretrizes.bombeiros.hidrografiaApoio.map(h => `  - ${h}`).join('\n')}
- **Rotas de Evacuação Preventiva:**
${diretrizes.bombeiros.rotasEvacuacao.map(r => `  - ${r}`).join('\n')}

#### B. Policiamento Ostensivo (Polícia Militar / Força Tática)
- **Vias Vicinais de Acesso:**
${diretrizes.policiamentoOstensivo.viasVicinaisControle.map(v => `  - ${v}`).join('\n')}
- **Pontos de Bloqueio e Cerco Sugeridos:**
${diretrizes.policiamentoOstensivo.pontosBloqueioSugeridos.map(b => `  - ${b}`).join('\n')}
- **Alerta de Monitoramento (Muralha Paulista / LPR):**
  - ${diretrizes.policiamentoOstensivo.alertaMuralhaPaulistaLPR}

#### C. Polícia Militar Ambiental e Perícia Técnico-Científica
- **Coordenada do Vértice de Ignição:** ${diretrizes.policiaAmbiental.coordenadaPontoOrigem}
- **Inspeção de Maquinário Agrícola:** ${diretrizes.policiaAmbiental.verificacaoMaquinario}
- **Confronto com SIGAMgeo:** ${diretrizes.policiaAmbiental.confrontoHistoricoAia}
- **Preservação de Evidências:** ${diretrizes.policiaAmbiental.orientacaoColetaVestigios}

---

### [5] INSTRUÇÃO FORENSE E TIPIFICAÇÃO LEGAL PRELIMINAR

#### A. Análise da Conduta e Tese Subjetiva (Dolo / Culpa)
- **Classificação Técnica Preliminar:** **${forense.teseAutoriaDolo.classificacao}**
- **Fundamentação Pericial:** ${forense.teseAutoriaDolo.fundamentacao}
- **Reincidência Documentada em AIA:** ${forense.teseAutoriaDolo.reincidenciaAia ? 'SIM (Registrada no SIGAMgeo)' : 'NÃO'}
- **Omissão de Aceiros Obrigatórios:** ${forense.teseAutoriaDolo.omissaoAceirosRegulamentares ? 'CONSTATADA / PRESUMIDA' : 'NÃO CONSTATADA'}

#### B. Tipificação Penal Preliminar (Esfera Criminal)
${forense.tipificacaoPenalPreliminar.map(tp => `
- **${tp.diploma} — ${tp.artigo}**
  - *Conduta:* ${tp.conduta}
  - *Cominação Legal:* ${tp.penaOuSancao}
`).join('')}

#### C. Tipificação Administrativa Ambiental (Sanções e Multas)
${forense.tipificacaoAdministrativa.map(ta => `
- **${ta.diploma} — ${ta.artigo}**
  - *Conduta Administrativa:* ${ta.conduta}
  - *Sanção Aplicável:* ${ta.penaOuSancao}
`).join('')}

#### D. Disponibilidade de Imagens Orbitais de Alta Resolução (Programa Brasil M.A.I.S)
- **Status PlanetScope (3m):** \`${forense.imagensBrasilMais.disponibilidadePlanetScope3m}\`
- **Janela Pré-Evento:** ${forense.imagensBrasilMais.janelaPreEvento}
- **Janela Pós-Evento:** ${forense.imagensBrasilMais.janelaPosEvento}
- **Instrução:** ${forense.imagensBrasilMais.instrucaoRequisicao}

> **${forense.ressalvaPreliminaridade}**

---

### [6] BLOCO DE CADEIA DE CUSTÓDIA E ASSINATURA CRIPTOGRÁFICA
\`\`\`text
========================= BLOCO DE CADEIA DE CUSTÓDIA =========================
SISTEMA: SIMIA-Verde / SENASP (Ministério da Justiça e Segurança Pública)
ALGORITMO: SHA-256 (FIPS 180-4)
REGISTRO DETERMINÍSTICO CANÔNICO:
${custodia.canonicalString}

HASH SHA-256 (64 HEX):
${custodia.sha256Hex}
==============================================================================
\`\`\`
*Relatório gerado em ambiente auditável com certificação de integridade.*
`;
}
