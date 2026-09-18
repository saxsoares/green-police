import React from 'react';
import {
  FolderOpen,
  PlusCircle,
  Radio,
  FileSearch,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface EmptyStateProps {
  titulo?: string;
  mensagem?: string;
  onNavigateToIngestion: () => void;
  onNavigateToSatellites: () => void;
  onLoadDemoCase?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  titulo = 'Nenhum Dossiê Forense Selecionado',
  mensagem = 'Selecione uma ocorrência ativa no topo da aplicação, inicie uma nova ingestão forense ou consulte focos orbitais reais nos satélites.',
  onNavigateToIngestion,
  onNavigateToSatellites,
  onLoadDemoCase
}) => {
  return (
    <div className="h-full min-h-[500px] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white border border-sky-100 rounded-2xl p-8 shadow-xs text-center">
        <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
          <FolderOpen className="w-7 h-7" />
        </div>

        <h2 className="text-base font-semibold text-slate-800 mb-2">{titulo}</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">{mensagem}</p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onNavigateToIngestion}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Iniciar Nova Ingestão Forense</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>

          <button
            type="button"
            onClick={onNavigateToSatellites}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 text-sky-600" />
            <span>Explorar Focos Reais em Satélites (INPE / NASA)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-400" />
          </button>

          {onLoadDemoCase && (
            <button
              type="button"
              onClick={onLoadDemoCase}
              className="w-full py-2 px-4 text-slate-400 hover:text-sky-700 hover:bg-sky-50/50 text-[11px] font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
            >
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>(Opcional) Carregar Caso Demonstrativo para Teste</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
