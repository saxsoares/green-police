import React from 'react';
import {
  ShieldAlert,
  Flame,
  Radio,
  Truck,
  Eye,
  AlertOctagon,
  CheckSquare,
  Navigation,
  Droplets,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { OcorrenciaCompleta } from '../../types';

interface DirectivesViewProps {
  ocorrencia: OcorrenciaCompleta;
}

export const DirectivesView: React.FC<DirectivesViewProps> = ({ ocorrencia }) => {
  const { diretrizes, projecao, meteo, input, contexto } = ocorrencia;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-600" />
            Diretrizes Táticas Operacionais Multiagências
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordenação integrada de pronta-resposta: Bombeiros (CBMSP), Policiamento Ostensivo (PM) e Polícia Ambiental / Perícia Técnico-Científica.
          </p>
        </div>

        {/* Alerta de Rádio / Prefixo */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs font-mono">
          <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
          <span>ALERTA REDE RÁDIO: {input.id}</span>
        </div>
      </div>

      {/* Grid Multiagências */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco 1: Corpo de Bombeiros */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Corpo de Bombeiros (CBMSP)
              </h3>
              <span className="text-[10px] text-slate-400">Combate & Salvamento</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-rose-800 mb-1">
                Vetor de Avanço do Fogo
              </span>
              <p className="p-2.5 bg-rose-50/60 rounded-lg text-slate-700 leading-relaxed border border-rose-100">
                {diretrizes.bombeiros.vetorAvanco}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                Pontos de Contenção & Aceiros
              </span>
              <ul className="space-y-1.5 text-slate-600">
                {diretrizes.bombeiros.pontosContencao.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 p-1.5 bg-slate-50 rounded">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                Pontos de Captação Hídrica
              </span>
              <ul className="space-y-1.5 text-slate-600">
                {diretrizes.bombeiros.hidrografiaApoio.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5 p-1.5 bg-sky-50/50 rounded">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                Rotas de Evacuação Preventiva
              </span>
              <ul className="space-y-1 text-slate-600">
                {diretrizes.bombeiros.rotasEvacuacao.map((r, i) => (
                  <li key={i} className="text-slate-600 text-[11px]">• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bloco 2: Policiamento Ostensivo */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Policiamento Ostensivo (PM / Força Tática)
              </h3>
              <span className="text-[10px] text-slate-400">Bloqueio, Triagem & Trânsito</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-sky-800 mb-1">
                Vias Vicinais de Controle
              </span>
              <ul className="space-y-1.5 text-slate-600">
                {diretrizes.policiamentoOstensivo.viasVicinaisControle.map((v, i) => (
                  <li key={i} className="p-2 bg-slate-50 rounded border border-slate-100">
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-sky-800 mb-1">
                Pontos de Bloqueio Recomendados
              </span>
              <ul className="space-y-1.5 text-slate-600">
                {diretrizes.policiamentoOstensivo.pontosBloqueioSugeridos.map((b, i) => (
                  <li key={i} className="p-2 bg-sky-50/50 rounded border border-sky-100 text-[11px]">
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 space-y-1">
              <span className="text-[11px] font-bold text-sky-900 block flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-sky-700" />
                Alerta LPR / Muralha Paulista
              </span>
              <p className="text-[11px] text-sky-800 leading-snug">
                {diretrizes.policiamentoOstensivo.alertaMuralhaPaulistaLPR}
              </p>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Isolamento:</strong> {diretrizes.policiamentoOstensivo.orientacaoSegurancaPerimetro}
            </div>
          </div>
        </div>

        {/* Bloco 3: Polícia Militar Ambiental e Perícia */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Polícia Ambiental & Perícia (SPT)
              </h3>
              <span className="text-[10px] text-slate-400">Materialidade & Autoria</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-emerald-800 mb-1">
                Vértice do Ponto de Origem
              </span>
              <p className="p-2 bg-slate-50 rounded font-mono text-[11px] text-slate-800 border border-slate-200/80">
                {diretrizes.policiaAmbiental.coordenadaPontoOrigem}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-700 mb-1">
                Inspeção de Maquinário Agrícola
              </span>
              <p className="p-2.5 bg-slate-50 rounded text-slate-700 leading-relaxed text-[11px]">
                {diretrizes.policiaAmbiental.verificacaoMaquinario}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-700 mb-1">
                Confronto Imediato com AIA (SIGAMgeo)
              </span>
              <p className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-amber-900 leading-relaxed text-[11px]">
                {diretrizes.policiaAmbiental.confrontoHistoricoAia}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-700 mb-1">
                Preservação do Vértice em V
              </span>
              <p className="p-2.5 bg-slate-50 rounded text-slate-600 text-[11px] leading-relaxed">
                {diretrizes.policiaAmbiental.orientacaoColetaVestigios}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
