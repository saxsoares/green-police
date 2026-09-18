import React from 'react';
import {
  FilePlus2,
  Compass,
  FileText,
  ShieldAlert,
  Hash,
  Network,
  HelpCircle,
  Flame,
  ShieldCheck,
  Clock,
  UserCheck,
  Radio,
  Moon,
  Sun
} from 'lucide-react';
import { Tema } from '../services/tema';

export type ActiveTab =
  | 'ingestion'
  | 'satellites'
  | 'map'
  | 'report'
  | 'directives'
  | 'custody'
  | 'connectors'
  | 'decisions';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tema: Tema;
  onAlternarTema: () => void;
  ocorrenciaId?: string | null;
  totalOcorrencias?: number;
  operadorId: string;
  currentUtc: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  tema,
  onAlternarTema,
  ocorrenciaId,
  totalOcorrencias = 0,
  operadorId,
  currentUtc
}) => {
  const menuItems: Array<{
    id: ActiveTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'ingestion',
      label: 'Nova Ocorrência',
      sublabel: 'Ingestão e Coordenadas',
      icon: FilePlus2
    },
    {
      id: 'satellites',
      label: 'Satélites & Focos',
      sublabel: 'SIPAM, INPE e NASA',
      icon: Radio
    },
    {
      id: 'map',
      label: 'Mapa Tático',
      sublabel: 'Propagação e Camadas',
      icon: Compass
    },
    {
      id: 'report',
      label: 'Relatório Forense',
      sublabel: 'Apresentação Oficial',
      icon: FileText
    },
    {
      id: 'directives',
      label: 'Diretrizes Táticas',
      sublabel: 'Bombeiros, Ostensivo, Amb.',
      icon: ShieldAlert
    },
    {
      id: 'custody',
      label: 'Cadeia de Custódia',
      sublabel: 'Validador SHA-256',
      icon: Hash
    },
    {
      id: 'connectors',
      label: 'Conectores & APIs',
      sublabel: 'Bases Públicas e WFS',
      icon: Network
    },
    {
      id: 'decisions',
      label: 'Decisões Relevantes',
      sublabel: 'Consultas ao Usuário',
      icon: HelpCircle
    }
  ];

  return (
    <aside
      id="sidebar-container"
      className="w-72 bg-white border-r border-sky-100 flex flex-col justify-between shrink-0 select-none shadow-[1px_0_4px_rgba(2,132,199,0.03)] z-30"
    >
      {/* Cabeçalho do Menu */}
      <div className="p-4 border-b border-sky-100/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm shadow-sky-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 text-base tracking-tight">SIMIA-Verde</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-700 rounded">SENASP</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">Inteligência Ambiental & Perícia</p>
          </div>
        </div>

        {/* Card Resumo da Ocorrência Ativa */}
        <div className="mt-3.5 p-2.5 bg-sky-50/60 rounded-lg border border-sky-100 text-xs">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[10px] uppercase font-semibold text-sky-700 tracking-wider">
              {ocorrenciaId ? 'Dossiê Ativo' : 'Dossiês'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-sky-700 font-medium">
              {totalOcorrencias} {totalOcorrencias === 1 ? 'caso' : 'casos'}
            </span>
          </div>
          <div className="font-mono font-medium text-slate-800 text-[11px] truncate">
            {ocorrenciaId || 'Nenhum selecionado'}
          </div>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav id="sidebar-navigation" className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-sky-50 text-sky-800 font-medium border border-sky-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border border-transparent'
              }`}
            >
              <div
                className={`p-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-sky-500 text-white' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs ${isActive ? 'text-sky-900 font-semibold' : 'text-slate-700 font-medium'}`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{item.sublabel}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Rodapé do Menu com Metadados */}
      <div className="p-3 border-t border-sky-100 bg-slate-50/50 space-y-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
          <span className="font-mono text-slate-700">{operadorId}</span>
          <span className="text-[10px] text-slate-400 ml-auto">PCSP / SENASP</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[10px] text-slate-600 truncate">{currentUtc}</span>
        </div>
        {/* Preferência de exibição da estação. Fica aqui, e não no cabeçalho, para não
            disputar espaço com os controles operacionais do dossiê ativo. */}
        <button
          type="button"
          onClick={onAlternarTema}
          title={tema === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          aria-label={tema === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          aria-pressed={tema === 'escuro'}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer no-print"
        >
          {tema === 'escuro'
            ? <Sun className="w-3.5 h-3.5 text-amber-500" />
            : <Moon className="w-3.5 h-3.5 text-sky-600" />}
          <span className="text-[11px] font-medium">
            {tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
          </span>
        </button>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-sky-600" /> SHA-256 Rigoroso
          </span>
          <span>v1.0 (SENASP)</span>
        </div>
      </div>
    </aside>
  );
};
