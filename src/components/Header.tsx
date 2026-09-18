import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Download,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  ExternalLink,
  MapPin,
  ChevronDown,
  FolderOpen,
  Trash2,
  PlusCircle,
  Check,
  Sparkles
} from 'lucide-react';
import { NivelRisco, OcorrenciaCompleta } from '../types';
import { StatusPersistencia } from '../services/ocorrenciasStorage';

interface HeaderProps {
  ocorrencia: OcorrenciaCompleta | null;
  listaOcorrencias: OcorrenciaCompleta[];
  onSelectOcorrencia: (id: string) => void;
  onDeleteOcorrencia: (id: string) => void;
  onNewOcorrencia: () => void;
  onLoadDemoCase?: () => void;
  onRefreshMeteo: () => void;
  isRefreshing: boolean;
  onNavigateTab: (tab: 'map' | 'report' | 'ingestion') => void;
  onQuickExport: () => void;
  statusPersistencia: StatusPersistencia;
}

export const Header: React.FC<HeaderProps> = ({
  ocorrencia,
  listaOcorrencias,
  onSelectOcorrencia,
  onDeleteOcorrencia,
  onNewOcorrencia,
  onLoadDemoCase,
  onRefreshMeteo,
  isRefreshing,
  onNavigateTab,
  onQuickExport,
  statusPersistencia
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRiscoBadge = (risco: NivelRisco) => {
    switch (risco) {
      case 'CRITICO':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'RISCO CRÍTICO'
        };
      case 'ALTO':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'RISCO ALTO'
        };
      case 'MEDIO':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
          label: 'RISCO MÉDIO'
        };
      case 'BAIXO':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'RISCO BAIXO'
        };
    }
  };

  const badge = ocorrencia ? getRiscoBadge(ocorrencia.projecao.nivelRisco) : null;

  // Estado da base pericial durável. SOMENTE_LOCAL é uma condição que o perito precisa
  // enxergar: o dossê existe apenas neste navegador e ainda não tem registro de custódia.
  const persistencia = {
    VERIFICANDO: {
      cls: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      label: 'VERIFICANDO BASE',
      title: 'Consultando a base pericial durável...'
    },
    SINCRONIZADO: {
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'BASE SINCRONIZADA',
      title: 'Dossiês gravados na base pericial durável com registro de cadeia de custódia.'
    },
    SOMENTE_LOCAL: {
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'SOMENTE LOCAL',
      title: 'Base pericial durável indisponível. Os dossês existem apenas no cache deste navegador '
        + 'e ainda NÃO possuem registro de cadeia de custódia no servidor.'
    }
  }[statusPersistencia];

  return (
    <header
      id="top-header-bar"
      className="min-h-16 py-2 bg-white border-b border-sky-100 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none z-30 relative"
    >
      {/* Seletor de Ocorrência / Dossiê Ativo */}
      <div className="flex items-center gap-2 min-w-0 shrink" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(prev => !prev)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer min-w-0 max-w-[30vw] overflow-hidden ${
              ocorrencia
                ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-900'
            }`}
          >
            <div className="p-1 rounded-md bg-white border border-slate-200/80 text-sky-600 shadow-2xs shrink-0">
              <FolderOpen className="w-3.5 h-3.5" />
            </div>

            {ocorrencia ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-800 tracking-tight truncate">
                    {ocorrencia.input.municipio} - {ocorrencia.input.uf}
                  </span>
                  {badge && (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${badge.bg}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  )}
                </div>
                {/* Uma linha só: com a tipografia ampliada, ID e comarca quebravam o
                    cabeçalho em três linhas. O texto completo fica no title. */}
                <div
                  className="flex items-center gap-2 text-[10px] text-slate-500 font-mono whitespace-nowrap overflow-hidden"
                  title={`${ocorrencia.input.id} • ${ocorrencia.input.comarca}`}
                >
                  <span className="shrink-0">{ocorrencia.input.id}</span>
                  <span className="shrink-0">•</span>
                  <span className="truncate">{ocorrencia.input.comarca}</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold text-sky-900 block">
                  Nenhum Dossiê Selecionado
                </span>
                <span className="text-[10px] text-sky-700 block">
                  Clique para selecionar ou criar ocorrência
                </span>
              </div>
            )}

            <ChevronDown
              className={`w-4 h-4 text-slate-400 ml-1 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Menu Dropdown de Gerenciamento e Seleção de Ocorrências */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Dossiês Cadastrados
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {listaOcorrencias.length}{' '}
                    {listaOcorrencias.length === 1 ? 'ocorrência ativa' : 'ocorrências ativas'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onNewOcorrencia();
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nova</span>
                </button>
              </div>

              {/* Lista de ocorrências salvas */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {listaOcorrencias.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <p className="mb-3">Nenhuma ocorrência registrada no momento.</p>
                    {onLoadDemoCase && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onLoadDemoCase();
                        }}
                        className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Carregar exemplo demonstrativo
                      </button>
                    )}
                  </div>
                ) : (
                  listaOcorrencias.map(item => {
                    const isSelected = ocorrencia?.input.id === item.input.id;
                    const itemBadge = getRiscoBadge(item.projecao.nivelRisco);
                    return (
                      <div
                        key={item.input.id}
                        className={`p-3 flex items-center justify-between gap-3 hover:bg-sky-50/60 transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-50/80' : ''
                        }`}
                        onClick={() => {
                          onSelectOcorrencia(item.input.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-sky-600 text-white' : 'border border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {item.input.municipio} - {item.input.uf}
                              </span>
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 ${itemBadge.bg}`}
                              >
                                {item.projecao.nivelRisco}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {item.input.id} • {new Date(item.input.timestampUtc).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>

                        {/* Botão de Exclusão da Ocorrência */}
                        <button
                          type="button"
                          title="Remover esta ocorrência da aplicação"
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteOcorrencia(item.input.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Dossiês salvos em armazenamento local seguro</span>
                {onLoadDemoCase && (
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLoadDemoCase();
                    }}
                    className="text-sky-600 hover:underline cursor-pointer"
                  >
                    Exemplo teste
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Excluir o dossiê ativo. Fica ao lado do seletor: ação destrutiva
            pertence junto do objeto sobre o qual age, não no canto oposto. */}
        {ocorrencia && (
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              onDeleteOcorrencia(ocorrencia.input.id);
            }}
            title={`Excluir o dossiê ${ocorrencia.input.id} da aplicação`}
            aria-label={`Excluir o dossiê ${ocorrencia.input.id} da aplicação`}
            className="shrink-0 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Condições Meteorológicas & Ações Rápidas */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 [&_button]:whitespace-nowrap">
        {/* Estado da base pericial durável (SQLite) */}
        <div
          title={persistencia.title}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold tracking-wide whitespace-nowrap ${persistencia.cls}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${persistencia.dot}`} />
          {persistencia.label}
        </div>

        {ocorrencia && (
          <>
            {/* Chips Meteorológicos */}
            <div className="hidden 2xl:flex items-center gap-2 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-lg text-xs text-slate-600 whitespace-nowrap">
              <div className="flex items-center gap-1" title="Velocidade e direção do vento">
                <Wind className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-semibold text-slate-700">
                  {ocorrencia.meteo.ventoVelocidadeKmH} km/h
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({ocorrencia.meteo.ventoDirecaoTexto})
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1" title="Umidade Relativa do Ar">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span
                  className={`font-semibold ${
                    ocorrencia.meteo.umidadeRelativaPercentual < 25
                      ? 'text-amber-600'
                      : 'text-slate-700'
                  }`}
                >
                  {ocorrencia.meteo.umidadeRelativaPercentual}% UR
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1" title="Temperatura">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-700">
                  {ocorrencia.meteo.temperaturaCelsius}°C
                </span>
              </div>
            </div>

            {/* Atualizar Clima */}
            <button
              id="btn-refresh-meteo"
              type="button"
              onClick={onRefreshMeteo}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-medium transition-colors cursor-pointer"
              title="Consultar condições meteorológicas ao vivo via Open-Meteo"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`}
              />
              <span className="hidden md:inline">
                {isRefreshing ? 'Consultando...' : 'Atualizar Clima'}
              </span>
            </button>

            {/* Ver Mapa */}
            <button
              id="btn-header-view-map"
              type="button"
              onClick={() => onNavigateTab('map')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver Mapa</span>
            </button>

            {/* Exportar Relatório */}
            <button
              id="btn-header-quick-export"
              type="button"
              onClick={onQuickExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Laudo</span>
            </button>

          </>
        )}

        {!ocorrencia && (
          <button
            type="button"
            onClick={onNewOcorrencia}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nova Ocorrência</span>
          </button>
        )}
      </div>
    </header>
  );
};
