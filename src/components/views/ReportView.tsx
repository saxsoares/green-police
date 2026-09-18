import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  ShieldCheck,
  Flame,
  Wind,
  Droplets,
  Calendar,
  MapPin,
  Building,
  AlertTriangle,
  Scale,
  Hash,
  Share2
} from 'lucide-react';
import { OcorrenciaCompleta } from '../../types';
import { renderRelatorioMarkdown } from '../../services/reportRenderer';
import { exportManchasGeoJson, latLngToUtm } from '../../services/geoCalculations';

interface ReportViewProps {
  ocorrencia: OcorrenciaCompleta;
}

export const ReportView: React.FC<ReportViewProps> = ({ ocorrencia }) => {
  const [tab, setTab] = useState<'formatted' | 'markdown' | 'json'>('formatted');
  const [copied, setCopied] = useState(false);

  const markdownContent = renderRelatorioMarkdown(ocorrencia);
  const utm = latLngToUtm(ocorrencia.input.coordenadas.lat, ocorrencia.input.coordenadas.lng);

  // Copiar Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Baixar Markdown
  const handleDownloadMd = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${ocorrencia.input.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Baixar JSON Estruturado
  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(ocorrencia, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocorrencia_${ocorrencia.input.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Baixar GeoJSON
  const handleDownloadGeoJson = () => {
    const geojson = exportManchasGeoJson(
      ocorrencia.projecao,
      ocorrencia.input.coordenadas,
      ocorrencia.input.id
    );
    const blob = new Blob([geojson], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manchas_${ocorrencia.input.id}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Imprimir / Salvar PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Barra de Ações do Relatório */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sky-100 no-print">
        {/* Seletor de Modo de Visualização */}
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab('formatted')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'formatted'
                ? 'bg-white text-sky-800 font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visualização Oficial
          </button>
          <button
            type="button"
            onClick={() => setTab('markdown')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'markdown'
                ? 'bg-white text-sky-800 font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Markdown (.md)
          </button>
          <button
            type="button"
            onClick={() => setTab('json')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'json'
                ? 'bg-white text-sky-800 font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON Estruturado
          </button>
        </div>

        {/* Botões de Exportação */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copiado!' : 'Copiar MD'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .md</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.json</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadGeoJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.geojson</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Visualização: Formato Markdown Bruto */}
      {tab === 'markdown' && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed overflow-x-auto select-text shadow-sm">
          <pre>{markdownContent}</pre>
        </div>
      )}

      {/* Visualização: JSON Estruturado */}
      {tab === 'json' && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed overflow-x-auto select-text shadow-sm">
          <pre>{JSON.stringify(ocorrencia, null, 2)}</pre>
        </div>
      )}

      {/* Visualização: Relatório Oficial Formatado SENASP */}
      {tab === 'formatted' && (
        <div className="bg-white border border-sky-100 rounded-xl p-8 shadow-xs space-y-8 select-text">
          {/* Cabeçalho Oficial */}
          <div className="border-b border-sky-100 pb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 tracking-wider uppercase">
                  SENASP / MJSP
                </span>
                <span className="text-xs text-slate-400 font-mono">SIMIA-Verde v1.0</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                Relatório de Inteligência Geoespacial e Instrução Forense
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Investigação Qualificada de Queimadas • Protocolo Forense Digital e Cadeia de Custódia
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-semibold text-slate-800">{ocorrencia.input.id}</div>
              <div className="text-[11px] text-slate-400 font-mono">{ocorrencia.input.timestampUtc}</div>
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Hash SHA-256 Certificado
              </div>
            </div>
          </div>

          {/* Seção 1: Identificação e Enquadramento */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-sky-800 flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-sky-600" />
              [1] Identificação e Enquadramento da Ocorrência
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                <div>
                  <span className="text-slate-400">Coordenadas WGS84:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">
                    {ocorrencia.input.coordenadas.lat.toFixed(6)}, {ocorrencia.input.coordenadas.lng.toFixed(6)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Referência UTM (SIRGAS 2000):</span>{' '}
                  <span className="font-mono font-medium text-slate-800">
                    Zona {utm.zone}S | E: {utm.easting} m | N: {utm.northing} m
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Município / Comarca:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {ocorrencia.input.municipio} - {ocorrencia.input.uf} ({ocorrencia.input.comarca})
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                <div>
                  <span className="text-slate-400">Operador / Agente Responsável:</span>{' '}
                  <span className="font-mono font-medium text-slate-800">{ocorrencia.input.operadorId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status de Autorização de Queima (SEMIL):</span>{' '}
                  <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                    {ocorrencia.input.autorizacaoQueimadaStatus}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  {ocorrencia.input.autorizacaoQueimadaDetalhe}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Enriquecimento Geoespacial SIGAMgeo */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-sky-800 flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Building className="w-4 h-4 text-sky-600" />
              [2] Enriquecimento Geoespacial e Contexto Ambiental (SIGAMgeo)
            </h2>
            <div className="border border-slate-200/80 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 text-[11px]">
                  <tr>
                    <th className="p-2.5">Camada Oficial</th>
                    <th className="p-2.5">Situação Identificada</th>
                    <th className="p-2.5">Confiabilidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Histórico de AIA</td>
                    <td className="p-2.5">
                      {ocorrencia.contexto.aia.valor.historicoEncontrado ? (
                        <div className="space-y-1">
                          <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            {/* NÃO afirmar reincidência: são autuações NO ENTORNO, de autuados
                                possivelmente distintos e nem sempre relacionadas a fogo.
                                Reincidência exige mesmo responsável pela gleba — não apurado aqui. */}
                            AUTUAÇÕES AMBIENTAIS NO ENTORNO ({ocorrencia.contexto.aia.valor.quantidadeRegistros} no raio · {ocorrencia.contexto.aia.valor.detalhes.length} listada(s))
                          </span>
                          <div className="text-[11px] text-slate-600">
                            {ocorrencia.contexto.aia.valor.detalhes.map(d => (
                              <div key={d.numeroAia}>
                                • {d.numeroAia} ({d.dataAutuacao}): {d.infracao} [{d.valorMulta}]
                              </div>
                            ))}
                          </div>
                          <div className="text-[11px] text-amber-700 mt-1">
                            Proximidade geográfica NÃO é reincidência: os autos acima podem ser de
                            autuados distintos e de natureza não relacionada ao fogo. Requisitar os
                            autos pelos números de processo para apurar o responsável.
                          </div>
                        </div>
                      ) : ocorrencia.contexto.aia.confiabilidade === 'INDISPONIVEL' ? (
                        // Consulta que falhou NÃO é "nenhum auto lavrado": confundir as duas
                        // coisas produz falsa negativa de reincidência no laudo assinado.
                        <span className="text-red-700 font-medium">
                          NÃO VERIFICADO — a consulta não foi realizada. A ausência de registro aqui
                          não atesta ausência de autuação anterior.
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          A base respondeu à consulta e não retornou auto de infração prévio no ponto.
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-sky-700 font-semibold">
                      [{ocorrencia.contexto.aia.confiabilidade}]
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">APP (Preservação Permanente)</td>
                    <td className="p-2.5">
                      {ocorrencia.contexto.app.confiabilidade === 'INDISPONIVEL' ? (
                        <span className="text-red-700 font-medium">
                          NÃO VERIFICADA — consulta cartográfica indisponível.
                        </span>
                      ) : (
                        // A sobreposição com APP não é medida por este sistema: o Overpass
                        // informa presença de feição hídrica no raio, não a distância à margem.
                        <span className="text-amber-800">
                          {ocorrencia.contexto.app.valor.tipoApp}
                          {ocorrencia.contexto.app.valor.cursoDaguaNome
                            ? ` (${ocorrencia.contexto.app.valor.cursoDaguaNome})`
                            : ''}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-sky-700 font-semibold">
                      [{ocorrencia.contexto.app.confiabilidade}]
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Vegetação Nativa</td>
                    <td className="p-2.5">
                      {ocorrencia.contexto.vegetacaoNativa.confiabilidade === 'INDISPONIVEL' ? (
                        <span className="text-red-700 font-medium">
                          NÃO VERIFICADA — exige caracterização pericial in loco.
                        </span>
                      ) : (
                        <>
                          Bioma: <strong>{ocorrencia.contexto.vegetacaoNativa.valor.bioma}</strong>
                          {ocorrencia.contexto.vegetacaoNativa.valor.fitofisionomia && (
                            <> · Fitofisionomia: <strong>{ocorrencia.contexto.vegetacaoNativa.valor.fitofisionomia}</strong></>
                          )}
                          {/* O estágio sucessional NÃO é fornecido pelo INPE: marcá-lo junto do
                              bioma como se fosse apurado sustentaria o Art. 38-A sem lastro. */}
                          <div className="text-[11px] text-amber-700 mt-1">
                            Estágio sucessional NÃO verificado — nenhuma fonte integrada o fornece.
                            A tipificação do Art. 38-A da Lei 9.605/98 depende dele.
                          </div>
                        </>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-sky-700 font-semibold">
                      [{ocorrencia.contexto.vegetacaoNativa.confiabilidade}]
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Unidade de Conservação</td>
                    <td className="p-2.5">
                      {ocorrencia.contexto.unidadeConservacao.confiabilidade === 'INDISPONIVEL' ? (
                        <span className="text-red-700 font-medium">
                          NÃO VERIFICADA — incidência em UC/Terra Indígena não apurada. Verificar no
                          CNUC/MMA e na FUNAI antes de concluir.
                        </span>
                      ) : ocorrencia.contexto.unidadeConservacao.valor.afetada ? (
                        <span className="font-semibold text-rose-700">
                          INCIDÊNCIA CONFIRMADA: {ocorrencia.contexto.unidadeConservacao.valor.nomeUC}
                        </span>
                      ) : (
                        // Consulta espacial ponto-em-polígono, não "raio de restrição".
                        <span className="text-slate-500">
                          Consulta espacial nos polígonos oficiais (FUNAI/MMA): a coordenada não incide
                          em Terra Indígena nem em Unidade de Conservação.
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-sky-700 font-semibold">
                      [{ocorrencia.contexto.unidadeConservacao.confiabilidade}]
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Incêndios oficiais (BOI)</td>
                    <td className="p-2.5">
                      {ocorrencia.contexto.incendiosOficiais.confiabilidade === 'INDISPONIVEL' ? (
                        <span className="text-red-700 font-medium">
                          NÃO VERIFICADO — consulta aos Boletins de Ocorrência de Incêndio não realizada.
                        </span>
                      ) : !ocorrencia.contexto.incendiosOficiais.valor.registrosEncontrados ? (
                        <span className="text-slate-500">
                          O órgão respondeu e não registrou boletim num raio de{' '}
                          {ocorrencia.contexto.incendiosOficiais.valor.raioMetros} m. Ausência de BOI
                          não é ausência de incêndio — o boletim depende de acionamento e lavratura.
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-semibold text-amber-800">
                            {ocorrencia.contexto.incendiosOficiais.valor.quantidade} boletim(ns) num raio de{' '}
                            {ocorrencia.contexto.incendiosOficiais.valor.raioMetros} m
                          </span>
                          <div className="text-[11px] text-slate-600">
                            {ocorrencia.contexto.incendiosOficiais.valor.detalhes.map(b => (
                              <div key={b.numeroBoi}>
                                • BOI {b.numeroBoi} ({b.dataDeteccao}): {b.caracterizacaoArea}
                                {b.abrangenciaUnidade !== 'Não informada' && ` — ${b.abrangenciaUnidade}`}
                              </div>
                            ))}
                          </div>
                          {/* Correspondência com o fato é HIPÓTESE a confirmar, nunca identidade estabelecida. */}
                          {ocorrencia.contexto.incendiosOficiais.valor.possivelCorrespondenciaComOFato ? (
                            <div className="text-[11px] text-rose-700 font-medium">
                              POSSÍVEL CORRESPONDÊNCIA com o fato: BOI{' '}
                              {ocorrencia.contexto.incendiosOficiais.valor.possivelCorrespondenciaComOFato} tem
                              data de detecção coincidente. Confirmar junto ao órgão gestor antes de
                              afirmar identidade entre os eventos.
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500">
                              Nenhum boletim com data coincidente à do fato — registros do entorno.
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-sky-700 font-semibold">
                      [{ocorrencia.contexto.incendiosOficiais.confiabilidade}]
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Cadastro Rural (CAR)</td>
                    <td className="p-2.5">
                      {ocorrencia.contexto.car.confiabilidade === 'INDISPONIVEL' ? (
                        <span className="text-red-700 font-medium">
                          NÃO VINCULADO — exige cruzamento com o SICAR pela autoridade policial.
                        </span>
                      ) : (
                        <>
                          Código: <span className="font-mono">{ocorrencia.contexto.car.valor.codigoCar}</span> · Status:{' '}
                          <strong>{ocorrencia.contexto.car.valor.status}</strong> · Área:{' '}
                          {ocorrencia.contexto.car.valor.areaPropriedadeHa} ha
                        </>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-sky-700 font-semibold">
                      [{ocorrencia.contexto.car.confiabilidade}]
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 3: Meteorologia & Modelo de Propagação */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-sky-800 flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Wind className="w-4 h-4 text-sky-600" />
              [3] Dinâmica Meteorológica e Modelagem de Propagação
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-100">
                <span className="text-slate-500 block text-[11px]">Vento Predominante</span>
                <span className="font-bold text-slate-800 text-sm">{ocorrencia.meteo.ventoVelocidadeKmH} km/h</span>
                <span className="text-[10px] text-slate-400 font-mono block">Origem: {ocorrencia.meteo.ventoDirecaoTexto} ({ocorrencia.meteo.ventoDirecaoGraus}°)</span>
              </div>
              <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-100">
                <span className="text-slate-500 block text-[11px]">Umidade Relativa</span>
                <span className={`font-bold text-sm ${ocorrencia.meteo.umidadeRelativaPercentual < 25 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {ocorrencia.meteo.umidadeRelativaPercentual}% UR
                </span>
                <span className="text-[10px] text-slate-400 block">Crítica para fogo</span>
              </div>
              <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-100">
                <span className="text-slate-500 block text-[11px]">Taxa de Avanço (Head)</span>
                <span className="font-bold text-slate-800 text-sm">{ocorrencia.projecao.taxaPropagacaoMetrosHora} m/h</span>
                <span className="text-[10px] text-slate-400 block">Velocidade da frente</span>
              </div>
              <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-100">
                <span className="text-slate-500 block text-[11px]">Nível de Risco</span>
                <span className="font-bold text-rose-700 text-sm">[{ocorrencia.projecao.nivelRisco}]</span>
                <span className="text-[10px] text-slate-400 block">Matriz de perigo</span>
              </div>
            </div>

            {/* Tabela de Manchas 1h, 3h, 6h */}
            <div className="border border-slate-200/80 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 text-[11px]">
                  <tr>
                    <th className="p-2.5">Horizonte Temporal</th>
                    <th className="p-2.5">Área Estimada</th>
                    <th className="p-2.5">Perímetro</th>
                    <th className="p-2.5">Comprimento Eixo Maior</th>
                    <th className="p-2.5">Azimute de Avanço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-2.5 font-bold text-amber-700">T + 1 Hora</td>
                    <td className="p-2.5 font-semibold text-slate-900">{ocorrencia.projecao.manchas.t1h.areaHectares} ha</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t1h.perimetroKm} km</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t1h.eixoMaiorMetros} m</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t1h.azimutePropagacaoGraus}° (Sotavento)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-orange-700">T + 3 Horas</td>
                    <td className="p-2.5 font-semibold text-slate-900">{ocorrencia.projecao.manchas.t3h.areaHectares} ha</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t3h.perimetroKm} km</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t3h.eixoMaiorMetros} m</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t3h.azimutePropagacaoGraus}°</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-rose-700">T + 6 Horas</td>
                    <td className="p-2.5 font-semibold text-slate-900">{ocorrencia.projecao.manchas.t6h.areaHectares} ha</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t6h.perimetroKm} km</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t6h.eixoMaiorMetros} m</td>
                    <td className="p-2.5 font-mono">{ocorrencia.projecao.manchas.t6h.azimutePropagacaoGraus}°</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 italic leading-snug">
              {ocorrencia.projecao.ressalvaForense}
            </p>
          </section>

          {/* Seção 4: Diretrizes Táticas Multiagências */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-sky-800 flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Flame className="w-4 h-4 text-sky-600" />
              [4] Diretrizes Táticas Multiagências
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <span className="font-semibold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                  Corpo de Bombeiros (CBMSP)
                </span>
                <p className="text-[11px] text-slate-600 font-medium">{ocorrencia.diretrizes.bombeiros.vetorAvanco}</p>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <strong>Pontos de Contenção:</strong>
                  {ocorrencia.diretrizes.bombeiros.pontosContencao.map((p, i) => (
                    <div key={i} className="text-slate-500">• {p}</div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <span className="font-semibold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                  Policiamento Ostensivo
                </span>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <strong>Pontos de Bloqueio:</strong>
                  {ocorrencia.diretrizes.policiamentoOstensivo.pontosBloqueioSugeridos.map((b, i) => (
                    <div key={i} className="text-slate-500">• {b}</div>
                  ))}
                </div>
                <p className="text-[11px] text-sky-900 bg-sky-50 p-1.5 rounded border border-sky-100">
                  {ocorrencia.diretrizes.policiamentoOstensivo.alertaMuralhaPaulistaLPR}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <span className="font-semibold text-slate-800 block text-xs border-b border-slate-200 pb-1">
                  Polícia Ambiental & Perícia
                </span>
                <p className="text-[11px] text-slate-600">
                  <strong>Vértice:</strong> {ocorrencia.diretrizes.policiaAmbiental.coordenadaPontoOrigem}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Maquinário:</strong> {ocorrencia.diretrizes.policiaAmbiental.verificacaoMaquinario}
                </p>
                <p className="text-[11px] text-slate-600">
                  {ocorrencia.diretrizes.policiaAmbiental.confrontoHistoricoAia}
                </p>
              </div>
            </div>
          </section>

          {/* Seção 5: Instrução Forense e Tipificação Preliminar */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-sky-800 flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Scale className="w-4 h-4 text-sky-600" />
              [5] Instrução Forense e Tipificação Legal Preliminar
            </h2>

            {/* Tese Subjetiva */}
            <div className="p-4 bg-sky-50/50 rounded-lg border border-sky-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Tese Subjetiva: <strong className="text-sky-900">{ocorrencia.forense.teseAutoriaDolo.classificacao}</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
                  {ocorrencia.forense.teseAutoriaDolo.reincidenciaAia ? 'Com Reincidência AIA' : 'Sem AIA Prévio'}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {ocorrencia.forense.teseAutoriaDolo.fundamentacao}
              </p>
            </div>

            {/* Tipificações Penais e Administrativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Esfera Penal */}
              <div className="space-y-2">
                <h3 className="font-semibold text-rose-800 text-[11px] uppercase tracking-wide">
                  Esfera Criminal (Lei Federal nº 9.605/1998)
                </h3>
                {ocorrencia.forense.tipificacaoPenalPreliminar.map((p, i) => (
                  <div key={i} className="p-2.5 bg-rose-50/50 rounded border border-rose-200/80 space-y-1">
                    <div className="font-bold text-rose-900">
                      {p.diploma} — {p.artigo}
                    </div>
                    <div className="text-slate-700 text-[11px]">{p.conduta}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Pena: {p.penaOuSancao}</div>
                  </div>
                ))}
              </div>

              {/* Esfera Administrativa */}
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-800 text-[11px] uppercase tracking-wide">
                  Esfera Administrativa (Decreto nº 6.514/2008 & Código Florestal)
                </h3>
                {ocorrencia.forense.tipificacaoAdministrativa.map((a, i) => (
                  <div key={i} className="p-2.5 bg-amber-50/50 rounded border border-amber-200/80 space-y-1">
                    <div className="font-bold text-amber-900">
                      {a.diploma} — {a.artigo}
                    </div>
                    <div className="text-slate-700 text-[11px]">{a.conduta}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Sanção: {a.penaOuSancao}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ressalva Jurídica */}
            <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-600 leading-relaxed border border-slate-200">
              <strong>Ressalva Jurídico-Policial:</strong> {ocorrencia.forense.ressalvaPreliminaridade}
            </div>
          </section>

          {/* Seção 6: Bloco de Cadeia de Custódia */}
          <section className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-sky-800 flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Hash className="w-4 h-4 text-sky-600" />
              [6] Bloco de Cadeia de Custódia e Validação Criptográfica SHA-256
            </h2>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-[11px] space-y-3">
              <div className="text-sky-400 font-bold border-b border-slate-800 pb-1">
                SISTEMA: SIMIA-Verde / SENASP • ALGORITMO: SHA-256 (FIPS 180-4)
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">STRING CANÔNICA DETERMINÍSTICA:</span>
                <span className="text-slate-200 break-all select-all font-medium">
                  {ocorrencia.custodia.canonicalString}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block text-[10px]">HASH CRIPTOGRÁFICO SHA-256 (64 HEX):</span>
                <span className="text-emerald-400 font-bold text-xs break-all select-all tracking-wider">
                  {ocorrencia.custodia.sha256Hex}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
