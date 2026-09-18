import React from 'react';
import { Loader2, Satellite } from 'lucide-react';
import type { EtapaProcessamento } from '../services/analyzer';

interface OverlayProcessamentoProps {
  visivel: boolean;
  etapa: EtapaProcessamento | null;
}

/**
 * Retorno visual durante a instrução de um dossiê.
 *
 * A análise encadeia cinco consultas a fontes externas (Open-Meteo, INPE,
 * Overpass, SIGAMgeo e geocodificação) e leva alguns segundos. Sem retorno,
 * o operador não sabe se o clique foi registrado e torna a clicar — e cada
 * clique adicional abre um dossiê novo, com novo registro de cadeia de
 * custódia. Por isso a sobreposição é BLOQUEANTE: além de informar, ela
 * impede o segundo disparo.
 *
 * O rótulo nomeia a fonte que está sendo consultada no momento. Quando uma
 * delas está lenta, o operador vê qual é — informação que ele precisa para
 * julgar se o resultado virá completo ou com camada declarada indisponível.
 */
export const OverlayProcessamento: React.FC<OverlayProcessamentoProps> = ({ visivel, etapa }) => {
  if (!visivel) return null;

  const percentual = etapa ? Math.round((etapa.indice / etapa.total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] no-print"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-100">
            <Satellite className="h-5 w-5 text-sky-600" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              Instruindo o dossiê pericial
            </h2>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">
              Consultando as fontes oficiais. Não feche nem recarregue a página.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2.5">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-600 mt-0.5" />
          <p className="text-sm text-slate-700 leading-snug">
            {etapa ? etapa.rotulo : 'Preparando a consulta às fontes...'}
          </p>
        </div>

        {/* Barra determinística: as etapas são conhecidas e numeradas. Ela avança
            devagar nas quatro primeiras (rede) e salta nas últimas, que são
            cálculo local — o comportamento reflete o custo real de cada etapa. */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-sky-600 transition-all duration-300 ease-out"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{etapa ? `Etapa ${etapa.indice} de ${etapa.total}` : 'Iniciando'}</span>
            <span>{percentual}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
