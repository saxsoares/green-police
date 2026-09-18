import React, { useEffect, useState } from 'react';
import {
  Flame,
  Radio,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
  ExternalLink,
  Globe,
  Layers,
  Info,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Calendar,
  Building2,
  ShieldAlert,
  X
} from 'lucide-react';
import {
  CoordenadaGeo,
  OcorrenciaInput,
  SipamEventoFogo,
  SipamFocoCalor,
  SipamEstatisticas,
  SipamEventoDetalhes
} from '../../types';
import {
  fetchFocosInpe,
  fetchFocosNasa,
  fetchSatellitesStatus,
  fetchIbgeMunicipios,
  fetchSipamStatus,
  fetchSipamEventos,
  fetchSipamFocos,
  fetchSipamEventoDetalhes,
  FocoNasaDetail
} from '../../services/apiConnectors';
import { ESTADOS_BRASIL } from '../../data/estadosBrasil';
import type { FocoInpeDetalhe } from '../../services/apiConnectors';
import { isoDeAquisicaoFirms } from '../../services/apiConnectors';

interface SatellitesViewProps {
  currentCoords: CoordenadaGeo;
  /** Análise em curso: os botões de ingestão travam para não abrir dossiê duplicado. */
  isLoading?: boolean;
  onSelectFocoToIngest: (foco: {
    lat: number;
    lng: number;
    origem: string;
    satelite: string;
    /** Horário da detecção orbital. `undefined` = não informado pela fonte — nunca "agora". */
    dataHoraUtc?: string;
    municipio?: string;
    frp?: number;
  }) => void;
}

export const SatellitesView: React.FC<SatellitesViewProps> = ({
  currentCoords,
  onSelectFocoToIngest,
  isLoading = false
}) => {
  const [subTab, setSubTab] = useState<'sipam' | 'inpe' | 'nasa' | 'comparativo'>('sipam');

  // Estados SIPAM Painel do Fogo (CENSIPAM / MD)
  const [ufSipam, setUfSipam] = useState<string>('SP');
  const [diasSipam, setDiasSipam] = useState<number>(30); // Limite máximo de 30 dias solicitado pelo usuário
  const [tipoSipam, setTipoSipam] = useState<'eventos' | 'focos_censipam' | 'focos_firms'>('eventos');
  const [filtroMunSipam, setFiltroMunSipam] = useState<string>('');
  const [statusSipam, setStatusSipam] = useState<string>('todos');
  const [horasSipam, setHorasSipam] = useState<number>(12);
  const [eventosSipam, setEventosSipam] = useState<SipamEventoFogo[]>([]);
  const [focosSipam, setFocosSipam] = useState<SipamFocoCalor[]>([]);
  const [statsSipam, setStatsSipam] = useState<SipamEstatisticas | null>(null);
  const [isLoadingSipam, setIsLoadingSipam] = useState<boolean>(false);
  const [msgSipam, setMsgSipam] = useState<string | null>(null);
  const [statusSipamInfo, setStatusSipamInfo] = useState<any>(null);
  const [municipiosSipamIbge, setMunicipiosSipamIbge] = useState<Array<{ id: number; nome: string }>>([]);
  const [selectedEventoModal, setSelectedEventoModal] = useState<SipamEventoDetalhes | null>(null);
  const [isLoadingEventoModal, setIsLoadingEventoModal] = useState<boolean>(false);

  // Status de Autenticação Geral
  const [statusInfo, setStatusInfo] = useState<{
    nasa: {
      hasKey: boolean;
      maskedKey: string | null;
      status: string;
      provider: string;
      sensores: string[];
      requerChave: boolean;
      telemetria?: {
        transaction_limit?: number;
        current_transactions?: number;
        transaction_interval?: string;
      };
    };
    inpe: {
      hasKey: boolean;
      requerChave: boolean;
      status: string;
      provider: string;
      satelites: string[];
      descricaoAutenticacao: string;
    };
  } | null>(null);

  // Estados INPE
  const [ufInpe, setUfInpe] = useState<string>('SP');
  const [filtroMunInpe, setFiltroMunInpe] = useState<string>('');
  const [municipiosInpeIbge, setMunicipiosInpeIbge] = useState<Array<{ id: number; nome: string }>>([]);
  const [focosInpe, setFocosInpe] = useState<FocoInpeDetalhe[]>([]);
  const [isLoadingInpe, setIsLoadingInpe] = useState<boolean>(false);
  const [msgInpe, setMsgInpe] = useState<string | null>(null);

  // Carregar municípios do IBGE para a UF do SIPAM
  useEffect(() => {
    let cancel = false;
    fetchIbgeMunicipios(ufSipam).then(list => {
      if (!cancel) setMunicipiosSipamIbge(list);
    });
    return () => {
      cancel = true;
    };
  }, [ufSipam]);

  // Carregar municípios do IBGE para a UF do INPE
  useEffect(() => {
    let cancel = false;
    fetchIbgeMunicipios(ufInpe).then(list => {
      if (!cancel) setMunicipiosInpeIbge(list);
    });
    return () => {
      cancel = true;
    };
  }, [ufInpe]);

  // Estados NASA FIRMS
  const [customKeyNasa, setCustomKeyNasa] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [sensorNasa, setSensorNasa] = useState<
    'VIIRS_NOAA20_NRT' | 'VIIRS_NOAA21_NRT' | 'VIIRS_SNPP_NRT' | 'MODIS_NRT'
  >('VIIRS_NOAA20_NRT');
  const [raioNasa, setRaioNasa] = useState<number>(30);
  const [diasNasa, setDiasNasa] = useState<number>(1);
  const [modoEscopoNasa, setModoEscopoNasa] = useState<'raio' | 'brasil'>('raio');
  const [focosNasa, setFocosNasa] = useState<FocoNasaDetail[]>([]);
  const [isLoadingNasa, setIsLoadingNasa] = useState<boolean>(false);
  const [msgNasa, setMsgNasa] = useState<string | null>(null);
  const [escopoInfoNasa, setEscopoInfoNasa] = useState<string | null>(null);
  const [nasaKeyError, setNasaKeyError] = useState<boolean>(false);

  // Carregar status inicial e dados do SIPAM
  useEffect(() => {
    async function loadStatus() {
      const st = await fetchSatellitesStatus();
      setStatusInfo(st);
      const stSipam = await fetchSipamStatus();
      setStatusSipamInfo(stSipam);
    }
    loadStatus();
    handleCarregarSipam(30, 'SP', 'eventos');
  }, []);

  // Consultar SIPAM Painel do Fogo
  const handleCarregarSipam = async (
    customDias?: number,
    customUf?: string,
    customTipo?: 'eventos' | 'focos_censipam' | 'focos_firms'
  ) => {
    const d = customDias !== undefined ? Math.min(Math.max(customDias, 1), 30) : diasSipam;
    const u = customUf || ufSipam;
    const t = customTipo || tipoSipam;
    if (customDias !== undefined) setDiasSipam(d);
    if (customUf) setUfSipam(u);
    if (customTipo) setTipoSipam(t);

    setIsLoadingSipam(true);
    setMsgSipam(null);

    try {
      if (t === 'eventos') {
        const res = await fetchSipamEventos({
          uf: u,
          dias: d,
          municipio: filtroMunSipam || undefined,
          status: statusSipam !== 'todos' ? statusSipam : undefined
        });
        setEventosSipam(res.eventos);
        setStatsSipam(res.estatisticas);
        if (res.eventos.length === 0) {
          setMsgSipam(`Nenhum evento de fogo registrado no SIPAM para ${u} nos últimos ${d} dias.`);
        }
      } else {
        const origem = t === 'focos_firms' ? 'firms' : 'censipam';
        const res = await fetchSipamFocos({
          origem,
          horas: horasSipam,
          estado: u
        });
        setFocosSipam(res.focos);
        if (res.focos.length === 0) {
          setMsgSipam(res.mensagem || `Nenhum foco orbital detectado na rede ${origem.toUpperCase()} nas últimas ${horasSipam}h.`);
        }
      }
    } catch {
      setMsgSipam('Erro ao consultar os servidores do SIPAM Painel do Fogo.');
    } finally {
      setIsLoadingSipam(false);
    }
  };

  // Abrir Dossiê Detalhado do Evento (CAR, Detecções e Prioridades)
  const handleAbrirDetalhesEvento = async (evento: SipamEventoFogo) => {
    setIsLoadingEventoModal(true);
    setSelectedEventoModal({
      sucesso: true,
      idEvento: evento.id_evento.toString(),
      evento,
      deteccoes: [],
      propriedadesCar: [],
      prioridades: []
    });

    try {
      const detalhes = await fetchSipamEventoDetalhes(evento.id_evento);
      setSelectedEventoModal(detalhes);
    } catch (e) {
      console.warn('Erro ao carregar detalhes do evento SIPAM:', e);
    } finally {
      setIsLoadingEventoModal(false);
    }
  };

  // Carregar focos do INPE
  const handleCarregarInpe = async (estadoParaConsultar?: string) => {
    const st = estadoParaConsultar || ufInpe;
    setIsLoadingInpe(true);
    setMsgInpe(null);
    try {
      const res = await fetchFocosInpe({ estado: st, janela: '48h', conjunto: 'todosats', limite: 500 });
      setFocosInpe(res.focos);
      if (!res.sucesso) {
        setMsgInpe(`CONSULTA NÃO REALIZADA — ${res.mensagem || 'fonte indisponível'}. `
          + (res.orientacaoOperador || 'A ausência de focos aqui não significa ausência de fogo.'));
      } else if (res.focos.length === 0) {
        setMsgInpe(res.mensagem || `O INPE respondeu à consulta e não reportou focos em ${st} nas últimas 48h.`);
      } else if (res.truncado) {
        setMsgInpe(`Exibindo ${res.quantidade} de ${res.totalNaFonte} focos retornados pela fonte (resultado limitado).`);
      }
    } catch {
      setMsgInpe('Falha de conexão com o GeoServer do INPE. Consulta NÃO realizada.');
    } finally {
      setIsLoadingInpe(false);
    }
  };

  // Carregar focos da NASA FIRMS
  const handleCarregarNasa = async (customDays?: number) => {
    setIsLoadingNasa(true);
    setMsgNasa(null);
    setEscopoInfoNasa(null);
    setNasaKeyError(false);
    const diasConsulta = customDays || diasNasa;
    if (customDays) setDiasNasa(customDays);

    try {
      const params: any = {
        source: sensorNasa,
        days: diasConsulta,
        mapKey: customKeyNasa.trim() || undefined
      };

      if (modoEscopoNasa === 'brasil') {
        params.country = 'BRA';
      } else {
        params.lat = currentCoords.lat;
        params.lng = currentCoords.lng;
        params.raioKm = raioNasa;
      }

      const res = await fetchFocosNasa(params);
      setFocosNasa(res.focos);
      if (res.escopo) setEscopoInfoNasa(res.escopo);

      // Atualizar telemetria da chave se foi fornecida nova
      if (customKeyNasa.trim()) {
        const novoStatus = await fetchSatellitesStatus(customKeyNasa.trim());
        setStatusInfo(novoStatus);
      }

      if (res.chaveInvalida || (res.requerChave && !res.temChaveConfigurada && !customKeyNasa)) {
        setNasaKeyError(true);
        setMsgNasa(res.mensagem || 'Chave da NASA FIRMS não encontrada ou inválida.');
      } else if (res.focos.length === 0) {
        setMsgNasa(
          res.mensagem ||
            `Nenhuma anomalia térmica detectada pelo sensor ${sensorNasa} no perímetro selecionado nas últimas ${diasConsulta * 24} horas.`
        );
      }
    } catch {
      setMsgNasa('Erro ao conectar com os servidores da NASA FIRMS.');
    } finally {
      setIsLoadingNasa(false);
    }
  };

  // Carregar automaticamente na montagem
  useEffect(() => {
    handleCarregarInpe('SP');
  }, []);

  const focosInpeFiltrados = focosInpe.filter(f =>
    !filtroMunInpe ? true : (f.municipio ?? '').toLowerCase().includes(filtroMunInpe.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-600" />
            Detecções Orbitais & Eventos de Fogo: SIPAM, INPE & NASA
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento espacial governamental e internacional com dados consolidados de até 30 dias (SIPAM), focos 24h (INPE) e alta resolução (NASA).
          </p>
        </div>

        {/* Resumo de Credenciamento / Chaves */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span><strong>SIPAM:</strong> Aberto (Até 30d)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span><strong>INPE:</strong> Aberto (24h)</span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              statusInfo?.nasa.hasKey || customKeyNasa
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-sky-600" />
            <span>
              <strong>NASA FIRMS:</strong>{' '}
              {statusInfo?.nasa.hasKey ? 'Chave Ativa (.env)' : customKeyNasa ? 'Chave Informada' : 'Chave Requerida'}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação entre Telas / Funcionalidades Separadas */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-3xl text-xs">
        <button
          type="button"
          onClick={() => setSubTab('sipam')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
            subTab === 'sipam'
              ? 'bg-white text-emerald-900 shadow-xs border border-emerald-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Flame className="w-4 h-4 text-emerald-600" />
          <span>SIPAM Painel do Fogo (CENSIPAM)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">Até 30d</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('inpe')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
            subTab === 'inpe'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Globe className="w-4 h-4 text-sky-600" />
          <span>INPE BDQueimadas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab('nasa');
            if (focosNasa.length === 0) handleCarregarNasa();
          }}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
            subTab === 'nasa'
              ? 'bg-white text-sky-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Flame className="w-4 h-4 text-sky-600" />
          <span>NASA FIRMS (EUA)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('comparativo')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
            subTab === 'comparativo'
              ? 'bg-white text-indigo-900 shadow-xs border border-indigo-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Tríplice Validação Forense</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TELA SEPARADA 0: SIPAM PAINEL DO FOGO (CENSIPAM / MINISTÉRIO DA DEFESA)   */}
      {/* ========================================================================= */}
      {subTab === 'sipam' && (
        <div className="space-y-5">
          {/* Banner Institucional Oficial CENSIPAM */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-emerald-950 text-sm">
                    SIPAM — Painel do Fogo (CENSIPAM / Ministério da Defesa)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 font-semibold text-[10px]">
                    API Oficial Aberta (Sem Chave)
                  </span>
                </div>
                <p className="text-emerald-900 leading-relaxed max-w-3xl">
                  Integração oficial com a API do Centro Gestor e Operacional do Sistema de Proteção da Amazônia.
                  Fornece eventos de fogo consolidados com delimitação de polígonos, cálculo de persistência de
                  <strong> até 30 dias (máximo regulamentar)</strong> e sobreposição imediata com o Cadastro Ambiental Rural (CAR),
                  Terras Indígenas (TI) e Unidades de Conservação (UC).
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-emerald-800">
                  <span className="flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Status Operacional: {statusSipamInfo?.online ? 'Conectado (CENSIPAM Operacional)' : 'Online / Acesso Direto'}
                  </span>
                  <span>•</span>
                  <span>Janela Temporal: <strong>1 a 30 dias (Máximo)</strong></span>
                  <span>•</span>
                  <a
                    href="https://panorama.sipam.gov.br/painel-do-fogo/api/swagger"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 underline font-medium"
                  >
                    <span>Documentação Swagger</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Filtros e Seletores de Consulta */}
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs space-y-4">
            {/* Linha 1: Modo de Consulta */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 mr-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Tipo de Dado:
              </span>
              <button
                type="button"
                onClick={() => handleCarregarSipam(diasSipam, ufSipam, 'eventos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tipoSipam === 'eventos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Eventos de Fogo Consolidados (Polígonos & CAR até 30 dias)
              </button>
              <button
                type="button"
                onClick={() => handleCarregarSipam(diasSipam, ufSipam, 'focos_censipam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tipoSipam === 'focos_censipam'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Focos Diretos CENSIPAM (Antenas CSPP 1-24h)
              </button>
              <button
                type="button"
                onClick={() => handleCarregarSipam(diasSipam, ufSipam, 'focos_firms')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tipoSipam === 'focos_firms'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Focos FIRMS via CENSIPAM (1-24h)
              </button>
            </div>

            {/* Linha 2: Filtros Específicos por Modo */}
            {tipoSipam === 'eventos' ? (
              <div className="space-y-3">
                {/* Seleção de Janela Temporal: até 30 dias no máximo */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Janela Temporal de Focos e Eventos (Últimos {diasSipam} dias — Máximo de 30 dias):
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {diasSipam} {diasSipam === 1 ? 'dia' : 'dias'} (Máx: 30)
                    </span>
                  </div>

                  {/* Botões Rápidos */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {[
                      { label: 'Últimos 30 dias (Máximo)', dias: 30 },
                      { label: 'Últimos 15 dias', dias: 15 },
                      { label: 'Últimos 7 dias', dias: 7 },
                      { label: 'Últimas 48 horas (2 dias)', dias: 2 },
                      { label: 'Últimas 24 horas (1 dia)', dias: 1 }
                    ].map(p => (
                      <button
                        key={p.dias}
                        type="button"
                        onClick={() => handleCarregarSipam(p.dias, ufSipam, 'eventos')}
                        className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                          diasSipam === p.dias
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Controle deslizante 1 a 30 dias */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono">1 dia</span>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={1}
                      value={diasSipam}
                      onChange={e => setDiasSipam(parseInt(e.target.value, 10))}
                      className="flex-1 accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 font-mono font-bold">30 dias (Limite API)</span>
                  </div>
                </div>

                {/* Filtros Geográficos e Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unidade Federativa (UF):
                    </label>
                    <select
                      value={ufSipam}
                      onChange={e => {
                        const novaUf = e.target.value;
                        setUfSipam(novaUf);
                        handleCarregarSipam(diasSipam, novaUf, 'eventos');
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                    >
                      {ESTADOS_BRASIL.map(est => (
                        <option key={est.sigla} value={est.sigla}>
                          {est.sigla} — {est.nome} ({est.regiao})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Filtrar Município (IBGE):
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        list="municipios-sipam-list"
                        placeholder="Ex: Ribeirão Preto, Altamira..."
                        value={filtroMunSipam}
                        onChange={e => setFiltroMunSipam(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                      <datalist id="municipios-sipam-list">
                        {municipiosSipamIbge.slice(0, 100).map(m => (
                          <option key={m.id} value={m.nome} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Status do Evento:
                    </label>
                    <select
                      value={statusSipam}
                      onChange={e => setStatusSipam(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="Ativo">Apenas Ativos (Fogo em curso)</option>
                      <option value="Em observação">Em observação (Sob monitoramento)</option>
                    </select>
                  </div>
                </div>

                {/* Atalhos rápidos de Estados mais impactados */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] pt-1">
                  <span className="text-slate-500 font-medium mr-1">Estados frequentes:</span>
                  {['SP', 'MT', 'PA', 'AM', 'MS', 'MA', 'TO', 'GO', 'MG'].map(ufQuick => (
                    <button
                      key={ufQuick}
                      type="button"
                      onClick={() => {
                        setUfSipam(ufQuick);
                        handleCarregarSipam(diasSipam, ufQuick, 'eventos');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        ufSipam === ufQuick
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {ufQuick}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Filtros de Focos Diretos (1 a 24 horas) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Janela Retroativa em Horas (1 a 24h):
                  </label>
                  <div className="flex items-center gap-2">
                    {[6, 12, 24].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setHorasSipam(h);
                          handleCarregarSipam(diasSipam, ufSipam, tipoSipam);
                        }}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                          horasSipam === h
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Últimas {h} horas
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Estado para filtragem:
                  </label>
                  <select
                    value={ufSipam}
                    onChange={e => {
                      setUfSipam(e.target.value);
                      handleCarregarSipam(diasSipam, e.target.value, tipoSipam);
                    }}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    {ESTADOS_BRASIL.map(est => (
                      <option key={est.sigla} value={est.sigla}>
                        {est.sigla} — {est.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Botão de Ação de Atualização */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                {tipoSipam === 'eventos'
                  ? `Consultando eventos com persistência nos últimos ${diasSipam} dias em ${ufSipam}`
                  : `Consultando focos orbitais das últimas ${horasSipam} horas`}
              </span>
              <button
                type="button"
                disabled={isLoadingSipam}
                onClick={() => handleCarregarSipam(diasSipam, ufSipam, tipoSipam)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSipam ? 'animate-spin' : ''}`} />
                <span>{isLoadingSipam ? 'Consultando CENSIPAM...' : 'Atualizar Dados SIPAM'}</span>
              </button>
            </div>
          </div>

          {/* Painel de Métricas e Inteligência do SIPAM (para Eventos de Fogo) */}
          {tipoSipam === 'eventos' && statsSipam && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Eventos de Fogo ({diasSipam}d)
                </div>
                <div className="text-xl font-black text-emerald-950 mt-1 font-mono">
                  {statsSipam.totalEventos}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  no estado de {ufSipam}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Área Total Queimada
                </div>
                <div className="text-xl font-black text-amber-700 mt-1 font-mono">
                  {statsSipam.totalAreaKm2.toLocaleString('pt-BR')} <span className="text-xs font-sans text-slate-600">km²</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  ~{(statsSipam.totalAreaKm2 * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} hectares
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Persistência Média
                </div>
                <div className="text-xl font-black text-slate-800 mt-1 font-mono">
                  {statsSipam.mediaPersistenciaDias} <span className="text-xs font-sans text-slate-600">dias</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  duração média do fogo
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Áreas Protegidas Atingidas
                </div>
                <div className="text-sm font-bold text-slate-800 mt-1 flex flex-col gap-0.5">
                  <span className="text-emerald-700">🌲 {statsSipam.totalEmUC} em Unid. Conservação</span>
                  <span className="text-purple-700">🪶 {statsSipam.totalEmTI} em Terras Indígenas</span>
                  {statsSipam.totalEmQuilombola > 0 && (
                    <span className="text-amber-700">🌾 {statsSipam.totalEmQuilombola} em Quilombolas</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mensagens de Feedback ou Alerta */}
          {msgSipam && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{msgSipam}</span>
            </div>
          )}

          {/* Listagem de Eventos de Fogo Consolidados */}
          {tipoSipam === 'eventos' && (
            <div className="bg-white rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    Eventos de Fogo Identificados pelo CENSIPAM no Estado de {ufSipam} ({eventosSipam.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Histórico de queima contínua de até 30 dias com polígonos delimitados e matrículas de imóveis rurais (CAR).
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Janela: Últimos {diasSipam} dias (Máx: 30)
                </span>
              </div>

              {eventosSipam.length === 0 && !isLoadingSipam ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <Flame className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Nenhum evento registrado no SIPAM com os filtros atuais.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Experimente selecionar outro estado (ex: MT, PA, AM) ou aumentar a janela para 30 dias.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {eventosSipam.map(evento => {
                    const isAtivo = evento.status_evento === 'Ativo';
                    const temUC = Boolean(evento.unidade_conservacao);
                    const temTI = Boolean(evento.terra_indigena);
                    const temQuilombola = Boolean(evento.quilombola);

                    return (
                      <div
                        key={evento.id_evento}
                        className="p-4 hover:bg-emerald-50/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Identificação e Metadados do Evento */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                isAtivo
                                  ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-red-600' : 'bg-amber-600'}`} />
                              {evento.status_evento}
                            </span>

                            <span className="font-mono text-xs font-bold text-slate-800">
                              Evento #{evento.id_evento}
                            </span>

                            <span className="text-slate-300">•</span>

                            <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {evento.municipio || 'Município não cadastrado'}, {ufSipam}
                            </span>
                          </div>

                          {/* Métricas do Evento */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
                            <span>
                              Área: <strong className="text-amber-700 font-bold">{evento.area_total_evento ? evento.area_total_evento.toFixed(2) : '—'} km²</strong>
                              {evento.area_total_evento && (
                                <span className="text-[10px] text-slate-500 font-sans ml-1">
                                  (~{(evento.area_total_evento * 100).toFixed(0)} ha)
                                </span>
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              Persistência: <strong className="text-slate-800 font-bold">{evento.persistencia_dias || 0} dia(s)</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Centroide: <strong>{evento.latitude.toFixed(4)}, {evento.longitude.toFixed(4)}</strong>
                            </span>
                          </div>

                          {/* Datas do Evento */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              Detecção inicial: <strong>{new Date(evento.dt_minima).toLocaleString('pt-BR')}</strong> até{' '}
                              <strong>{new Date(evento.dt_maxima).toLocaleString('pt-BR')}</strong>
                            </span>
                          </div>

                          {/* Tags de Territórios Protegidos */}
                          {(temUC || temTI || temQuilombola) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {temUC && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-emerald-600" />
                                  UC: {evento.unidade_conservacao}
                                </span>
                              )}
                              {temTI && (
                                <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-medium">
                                  TI: {evento.terra_indigena}
                                </span>
                              )}
                              {temQuilombola && (
                                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium">
                                  Quilombola: {evento.quilombola}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Ações Periciais */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAbrirDetalhesEvento(evento)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Ver Imóveis CAR & Deteccoes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onSelectFocoToIngest({
                                lat: evento.latitude,
                                lng: evento.longitude,
                                origem: `SIPAM Painel do Fogo — Evento #${evento.id_evento} (${evento.status_evento})`,
                                satelite: `CENSIPAM / MD — Área ${evento.area_total_evento?.toFixed(2) || '—'} km² (${evento.persistencia_dias || 1}d persistência)`,
                                dataHoraUtc: evento.dt_maxima || evento.dt_minima || undefined,
                                municipio: evento.municipio || undefined
                              })
                            }
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Instruindo dossiê...</span>
                              </>
                            ) : (
                              <>
                                <span>Instruir Dossiê Pericial</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tabela de Focos Diretos do CENSIPAM ou FIRMS */}
          {tipoSipam !== 'eventos' && (
            <div className="bg-white rounded-xl border border-emerald-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800">
                  Focos de Calor Orbitais Detectados ({focosSipam.length}) — Rede {tipoSipam === 'focos_firms' ? 'FIRMS via CENSIPAM' : 'CENSIPAM (Antenas Terrestres)'}
                </h3>
              </div>

              {focosSipam.length === 0 && !isLoadingSipam ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Nenhum foco de calor detectado para esta janela de horas.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Passagem (UTC)</th>
                        <th className="px-4 py-2.5">Satélite</th>
                        <th className="px-4 py-2.5">Coordenadas</th>
                        <th className="px-4 py-2.5">Potência FRP</th>
                        <th className="px-4 py-2.5">Confiança</th>
                        <th className="px-4 py-2.5">Brilho I-4</th>
                        <th className="px-4 py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {focosSipam.map((f, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-700 text-[11px]">
                            {new Date(f.dt_aquisicao).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{f.satelite}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">
                            {f.lat.toFixed(4)}, {f.lng.toFixed(4)}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-amber-700 font-bold text-[11px]">
                            {f.frp !== undefined ? `${f.frp.toFixed(1)} MW` : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {f.confidence || 'nominal'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">
                            {f.bright_ti4 ? `${f.bright_ti4.toFixed(1)} K` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectFocoToIngest({
                                  lat: f.lat,
                                  lng: f.lng,
                                  origem: `SIPAM Painel do Fogo (${f.satelite})`,
                                  satelite: f.satelite,
                                  dataHoraUtc: f.dt_aquisicao,
                                  frp: f.frp
                                })
                              }
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Instruindo dossiê...</span>
                                </>
                              ) : (
                                <>
                                  <span>Instruir Laudo</span>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal / Dossiê do Evento SIPAM (Propriedades CAR e Detecções) */}
      {selectedEventoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Dossiê do Evento de Fogo #{selectedEventoModal.idEvento} (SIPAM)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sobreposição com o Cadastro Ambiental Rural (CAR) e histórico de detecções
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {isLoadingEventoModal ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Consultando bases fundiárias do CAR e detecções no CENSIPAM...</span>
                </div>
              ) : (
                <>
                  {/* Resumo do Evento */}
                  {selectedEventoModal.evento && (
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1 text-slate-700">
                      <div className="font-semibold text-emerald-950 flex items-center justify-between">
                        <span>Município: {selectedEventoModal.evento.municipio || 'Não indexado'} ({ufSipam})</span>
                        <span className="font-mono text-xs text-amber-700">
                          Área: {selectedEventoModal.evento.area_total_evento?.toFixed(2)} km² (~{(selectedEventoModal.evento.area_total_evento * 100).toFixed(0)} ha)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Período detectado: {new Date(selectedEventoModal.evento.dt_minima).toLocaleString('pt-BR')} até{' '}
                        {new Date(selectedEventoModal.evento.dt_maxima).toLocaleString('pt-BR')} ({selectedEventoModal.evento.persistencia_dias} dias)
                      </div>
                    </div>
                  )}

                  {/* Seção de Imóveis Rurais CAR Atingidos */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Imóveis Rurais do CAR Sobrepostos ({selectedEventoModal.propriedadesCar.length}):
                    </h4>
                    {selectedEventoModal.propriedadesCar.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
                        Nenhum imóvel do CAR indexado diretamente dentro do polígono deste evento, ou área sobreposta a terras públicas/devolutas.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedEventoModal.propriedadesCar.map((car, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono text-[11px]"
                          >
                            <div className="font-bold text-slate-900 break-all">
                              Código CAR: {car.cod_imovel}
                            </div>
                            <div className="text-slate-600 text-[10px]">
                              Localidade: {car.municipio} - {car.estado}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-sans font-semibold">
                              ✓ Relevante para requisição ao SICAR para identificação do proprietário ou posseiro.
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detecções Orbitais Agrupadas */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Radio className="w-4 h-4 text-sky-600" />
                      Detecções Orbitais Vinculadas ao Evento ({selectedEventoModal.deteccoes.length}):
                    </h4>
                    {selectedEventoModal.deteccoes.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
                        Detecções pontuais integradas ao polígono do evento.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedEventoModal.deteccoes.slice(0, 10).map((det, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-[11px]"
                          >
                            <span>
                              <strong>{det.satelite}</strong> — {new Date(det.dt_aquisicao).toLocaleString('pt-BR')}
                            </span>
                            <span className="font-mono text-slate-600">
                              {det.npontos} ponto(s) | FRP médio: {det.frp_avg ? `${det.frp_avg.toFixed(1)} MW` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedEventoModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium"
              >
                Fechar
              </button>

              {selectedEventoModal.evento && (
                <button
                  type="button"
                  onClick={() => {
                    const ev = selectedEventoModal.evento!;
                    onSelectFocoToIngest({
                      lat: ev.latitude,
                      lng: ev.longitude,
                      origem: `SIPAM Painel do Fogo — Evento #${ev.id_evento} (${ev.status_evento})`,
                      satelite: `CENSIPAM / MD — CAR Overlap (${selectedEventoModal.propriedadesCar.length} imóveis)`,
                      dataHoraUtc: ev.dt_maxima || ev.dt_minima || undefined,
                      municipio: ev.municipio || undefined
                    });
                    setSelectedEventoModal(null);
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Instruindo ocorrência...</span>
                    </>
                  ) : (
                    <>
                      <span>Instruir Ocorrência com este Evento</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TELA SEPARADA 1: INPE BDQUEIMADAS */}
      {/* ========================================================================= */}
      {subTab === 'inpe' && (
        <div className="space-y-5">
          {/* Banner de Esclarecimento sobre API do INPE */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-emerald-900">
                O INPE BDQueimadas NÃO precisa de chave ou token de API
              </h4>
              <p className="text-emerald-800 leading-relaxed">
                Diferente da NASA que exige cadastro de chave pessoal (MAP_KEY), o Programa Queimadas do Instituto Nacional
                de Pesquisas Espaciais (INPE/MCTI) é uma infraestrutura de <strong>dados abertos governamentais 100% pública</strong>. 
                O SIMIA-Verde conecta-se diretamente aos servidores federais sem qualquer necessidade de credenciais ou senhas.
              </p>
              <div className="text-[11px] text-emerald-700 pt-1 flex items-center gap-3">
                <span>🛰️ Satélites de referência: <strong>AQUA, TERRA, NOAA-20, METOP-B, GOES-16</strong></span>
                <span>•</span>
                <span>🏛️ Gestão: <strong>MCTI / Governo Federal</strong></span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Disparo de Consulta INPE */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Unidade Federativa (UF)
                </label>
                <select
                  value={ufInpe}
                  onChange={e => {
                    const novaUf = e.target.value;
                    setUfInpe(novaUf);
                    setFiltroMunInpe('');
                    handleCarregarInpe(novaUf);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white focus:border-sky-500 outline-none cursor-pointer"
                >
                  {ESTADOS_BRASIL.map(est => (
                    <option key={est.sigla} value={est.sigla}>
                      {est.sigla} — {est.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-slate-500">
                    Filtrar por Município ({ufInpe})
                  </label>
                  {municipiosInpeIbge.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {municipiosInpeIbge.length} cidades IBGE
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="inpe-municipios-datalist"
                    value={filtroMunInpe}
                    onChange={e => setFiltroMunInpe(e.target.value)}
                    placeholder={`Buscar em ${ufInpe}...`}
                    className="w-56 pl-2.5 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2" />
                  <datalist id="inpe-municipios-datalist">
                    {municipiosInpeIbge.map(m => (
                      <option key={m.id} value={m.nome} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCarregarInpe()}
                disabled={isLoadingInpe}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoadingInpe ? 'animate-spin' : ''}`} />
                <span>{isLoadingInpe ? 'Consultando INPE...' : 'Atualizar Focos do INPE'}</span>
              </button>
            </div>
          </div>

          {/* Mensagens de retorno */}
          {msgInpe && (
            <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200 flex items-center justify-between">
              <span>{msgInpe}</span>
              <button type="button" onClick={() => setMsgInpe(null)} className="text-slate-400 hover:text-slate-600 text-[10px]">
                Fechar ✕
              </button>
            </div>
          )}

          {/* Lista e Tabela de Focos do INPE */}
          <div className="bg-white rounded-xl border border-sky-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Focos de Calor Detectados no INPE ({focosInpeFiltrados.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Estado: {ufInpe} | Últimas 24h
              </span>
            </div>

            {focosInpeFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <Globe className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Nenhum foco de satélite ativo registrado pelo INPE no momento com os filtros selecionados.</p>
                <p className="text-[11px] text-slate-400">
                  Experimente alternar para o estado SP ou carregar o foco através da ingestão de coordenadas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Município / Local</th>
                      <th className="px-4 py-2.5">Satélite de Passagem</th>
                      <th className="px-4 py-2.5">Data / Hora UTC</th>
                      <th className="px-4 py-2.5">Coordenadas (WGS84)</th>
                      <th className="px-4 py-2.5">FRP (MW)</th>
                      <th className="px-4 py-2.5 text-right">Ação Pericial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {focosInpeFiltrados.map((f, idx) => (
                      <tr key={idx} className="hover:bg-sky-50/40 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {f.municipio ?? <span className="text-slate-400 italic">não informado</span>}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sky-800 text-[11px]">
                          {f.satelite ?? <span className="text-slate-400 italic">não informado</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                          {f.dataHoraGmt ? f.dataHoraGmt.slice(0, 19).replace('T', ' ') : 'horário não informado'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">
                          {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-amber-700 font-semibold text-[11px]">
                          {typeof f.frp === 'number' ? `${f.frp.toFixed(1)} MW` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              onSelectFocoToIngest({
                                lat: f.latitude,
                                lng: f.longitude,
                                origem: `Detecção orbital INPE BDQueimadas`
                                  + `${f.satelite ? ` (${f.satelite})` : ''}`
                                  + `${f.idFocoBdq ? ` — foco nº ${f.idFocoBdq}` : ''}`,
                                satelite: f.satelite ?? 'não informado pela fonte',
                                dataHoraUtc: f.dataHoraGmt ?? undefined,
                                municipio: f.municipio ?? undefined,
                                frp: f.frp ?? undefined
                              })
                            }
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Instruindo dossiê...</span>
                              </>
                            ) : (
                              <>
                                <span>Instruir Laudo</span>
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TELA SEPARADA 2: NASA FIRMS */}
      {/* ========================================================================= */}
      {subTab === 'nasa' && (
        <div className="space-y-5">
          {/* Card de Configuração e Telemetria da Chave da NASA */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-50 text-sky-600">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Credencial NASA FIRMS (MAP_KEY)</span>
                    {statusInfo?.nasa.telemetria && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        Verificada na NASA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Acesso direto aos sensores orbitais VIIRS 375m e MODIS 1km via NASA Earthdata LANCE / EOSDIS.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${
                    statusInfo?.nasa.hasKey
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {statusInfo?.nasa.hasKey ? `Chave Ativa: ${statusInfo.nasa.maskedKey}` : 'Aguardando MAP_KEY'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-xs text-sky-700 hover:text-sky-900 underline font-medium cursor-pointer"
                >
                  {showKeyInput ? 'Ocultar Campo' : 'Alterar / Testar Outra Chave'}
                </button>
              </div>
            </div>

            {/* Telemetria Oficial em Tempo Real da NASA */}
            {statusInfo?.nasa.telemetria && (
              <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-sky-900">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>
                    <strong>Cota Oficial NASA:</strong> {statusInfo.nasa.telemetria.current_transactions ?? '—'} de{' '}
                    {statusInfo.nasa.telemetria.transaction_limit ?? '—'} requisições utilizadas
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Renovação de cota: a cada {statusInfo.nasa.telemetria.transaction_interval || '10 minutos'}
                </div>
              </div>
            )}

            {showKeyInput && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Insira ou substitua sua MAP_KEY da NASA FIRMS (32 caracteres):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={customKeyNasa}
                    onChange={e => setCustomKeyNasa(e.target.value)}
                    placeholder="Ex: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCarregarNasa()}
                    className="px-4 py-1.5 text-xs rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors cursor-pointer"
                  >
                    Testar Chave
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Dica: A chave configurada no ambiente já é reconhecida e aceita diretamente pelos servidores da NASA. Caso queira usar outra, gere gratuitamente em{' '}
                  <a
                    href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 underline inline-flex items-center gap-0.5"
                  >
                    NASA Earthdata FIRMS <ExternalLink className="w-2.5 h-2.5" />
                  </a>.
                </p>
              </div>
            )}
          </div>

          {/* Barra de Filtros da NASA: Sensores, Período e Escopo Espacial */}
          <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Seletor de Sensor */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Sensor Orbital da NASA
                  </label>
                  <select
                    value={sensorNasa}
                    onChange={e => setSensorNasa(e.target.value as any)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white focus:border-sky-500 outline-none"
                  >
                    <option value="VIIRS_NOAA20_NRT">VIIRS 375m (NOAA-20 / JPSS-1) — Resolução Máxima</option>
                    <option value="VIIRS_NOAA21_NRT">VIIRS 375m (NOAA-21 / JPSS-2)</option>
                    <option value="VIIRS_SNPP_NRT">VIIRS 375m (Suomi-NPP)</option>
                    <option value="MODIS_NRT">MODIS 1km (Satélites Terra e Aqua)</option>
                  </select>
                </div>

                {/* Seletor de Janela Temporal */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Janela Temporal
                  </label>
                  <select
                    value={diasNasa}
                    onChange={e => setDiasNasa(parseInt(e.target.value, 10))}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:border-sky-500 outline-none"
                  >
                    <option value={1}>Últimas 24h (1 dia)</option>
                    <option value={2}>Últimas 48h (2 dias)</option>
                    <option value={3}>Últimas 72h (3 dias)</option>
                    <option value={5}>Últimos 5 dias</option>
                  </select>
                </div>

                {/* Escopo Espacial */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Abrangência de Busca
                  </label>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setModoEscopoNasa('raio')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        modoEscopoNasa === 'raio'
                          ? 'bg-white text-sky-800 font-medium shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Raio em Torno do Foco
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoEscopoNasa('brasil')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        modoEscopoNasa === 'brasil'
                          ? 'bg-white text-sky-800 font-medium shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Brasil (Nacional)
                    </button>
                  </div>
                </div>

                {modoEscopoNasa === 'raio' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Raio de Cobertura
                    </label>
                    <select
                      value={raioNasa}
                      onChange={e => setRaioNasa(parseInt(e.target.value))}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:border-sky-500 outline-none"
                    >
                      <option value={15}>15 km (Local)</option>
                      <option value={30}>30 km (Comarca)</option>
                      <option value={60}>60 km (Regional)</option>
                      <option value={100}>100 km (Macrorregional)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Botão de Consulta */}
              <button
                type="button"
                onClick={() => handleCarregarNasa()}
                disabled={isLoadingNasa}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNasa ? 'animate-spin' : ''}`} />
                <span>{isLoadingNasa ? 'Requisitando NASA...' : 'Consultar NASA FIRMS'}</span>
              </button>
            </div>

            {escopoInfoNasa ? (
              <div className="text-[11px] text-sky-700 bg-sky-50/70 px-3 py-1.5 rounded-md flex items-center gap-2 border border-sky-100 font-mono">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Escopo Ativo: {escopoInfoNasa}</span>
              </div>
            ) : modoEscopoNasa === 'raio' ? (
              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-50 font-mono">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  Centrado no foco pericial atual: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)} (Raio de {raioNasa} km)
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-50 font-mono">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Varredura Nacional pelo Bounding Box oficial do Brasil no NASA FIRMS [-74, -34, -34, 5.5]</span>
              </div>
            )}
          </div>

          {/* Retorno e Avisos */}
          {msgNasa && (
            <div
              className={`p-3 text-xs rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                nasaKeyError
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {nasaKeyError ? <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> : <Info className="w-4 h-4 text-slate-400 shrink-0" />}
                <span>{msgNasa}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {focosNasa.length === 0 && diasNasa === 1 && (
                  <button
                    type="button"
                    onClick={() => handleCarregarNasa(3)}
                    className="px-2.5 py-1 text-[11px] rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-medium transition-colors cursor-pointer"
                  >
                    Buscar últimos 3 dias
                  </button>
                )}
                <button type="button" onClick={() => setMsgNasa(null)} className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Focos da NASA */}
          <div className="bg-white rounded-xl border border-sky-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Anomalias Térmicas VIIRS / MODIS da NASA ({focosNasa.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Sensor: {sensorNasa} | Janela: {diasNasa} dia(s)
              </span>
            </div>

            {focosNasa.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-3">
                <Flame className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-700">
                  Nenhuma anomalia térmica detectada pelo sensor selecionado nesta janela temporal ({diasNasa} dia{diasNasa > 1 ? 's' : ''}).
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCarregarNasa(3)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-medium transition-colors cursor-pointer"
                  >
                    Expandir para últimos 3 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoEscopoNasa('brasil');
                      setTimeout(() => handleCarregarNasa(), 50);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors cursor-pointer"
                  >
                    Ver Focos no Brasil Todo
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Passagem (UTC)</th>
                      <th className="px-4 py-2.5">Satélite / Sensor</th>
                      <th className="px-4 py-2.5">Coordenadas</th>
                      <th className="px-4 py-2.5">Potência FRP</th>
                      <th className="px-4 py-2.5">Confiança</th>
                      <th className="px-4 py-2.5">Canal Térmico I-4</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {focosNasa.map((f, idx) => {
                      const isHigh = f.confidence === 'h' || f.confidence === 'high' || parseInt(f.confidence || '0') > 80;
                      return (
                        <tr key={idx} className="hover:bg-sky-50/40 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-700 text-[11px]">
                            {(() => {
                              const iso = isoDeAquisicaoFirms(f.acq_date, f.acq_time);
                              return iso
                                ? `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`
                                : 'horário não informado';
                            })()}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {f.satellite || 'NOAA-20'} ({f.instrument || 'VIIRS'})
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600 text-[11px]">
                            {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-amber-700 font-bold text-[11px]">
                            {f.frp ? `${f.frp.toFixed(1)} MW` : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isHigh
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {f.confidence === 'h' ? 'Alta (High)' : f.confidence === 'n' ? 'Nominal' : f.confidence || 'Nominal'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">
                            {f.bright_ti4 ? `${f.bright_ti4.toFixed(1)} K` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectFocoToIngest({
                                  lat: f.latitude,
                                  lng: f.longitude,
                                  origem: `Detecção Orbital NASA FIRMS (${f.satellite || 'VIIRS'})`,
                                  satelite: `${f.satellite || 'NOAA-20'} VIIRS 375m`,
                                  // Sem acq_date/acq_time a detecção fica sem horário: carimbar "hoje ao meio-dia"
                                  // criava prova falsa sobre quando o fogo foi detectado.
                                  dataHoraUtc: isoDeAquisicaoFirms(f.acq_date, f.acq_time),
                                  frp: f.frp
                                })
                              }
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Instruindo dossiê...</span>
                                </>
                              ) : (
                                <>
                                  <span>Instruir Laudo</span>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TELA SEPARADA 3: CONFRONTO FORENSE (TRÍPLICE VALIDAÇÃO: SIPAM x INPE x NASA) */}
      {/* ========================================================================= */}
      {subTab === 'comparativo' && (
        <div className="space-y-5">
          {/* Card Conceitual de Valor Jurídico */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-indigo-950">
                Tríplice Validação Orbital: O Valor Probatório do Cruzamento SIPAM + INPE + NASA
              </h4>
              <p className="text-indigo-900 leading-relaxed">
                No processo penal ambiental (Art. 41 da Lei Federal nº 9.605/1998 e Art. 250 do Código Penal), a alegação
                de "falso positivo" ou "erro de sensor" é frequentemente arguida pela defesa técnica. Quando a perícia
                oficial apresenta a <strong>convergência temporal e espacial entre três sistemas orbitais soberanos e complementares
                (SIPAM do Ministério da Defesa, INPE do MCTI e NASA dos EUA)</strong>, a materialidade da queima e a autoria
                fundiária tornam-se <strong>incontestáveis</strong> perante o Ministério Público e o Poder Judiciário.
              </p>
            </div>
          </div>

          {/* Matriz Comparativa Técnica */}
          <div className="bg-white rounded-xl border border-sky-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                Matriz Comparativa de Capacidades dos Três Sistemas Orbitais Oficiais
              </h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-3 py-3">Critério Técnico / Pericial</th>
                  <th className="px-3 py-3 text-emerald-900 bg-emerald-50/70">SIPAM Painel do Fogo (CENSIPAM/MD)</th>
                  <th className="px-3 py-3 text-emerald-800 bg-emerald-50/30">INPE BDQueimadas (MCTI)</th>
                  <th className="px-3 py-3 text-sky-800 bg-sky-50/40">NASA FIRMS (EUA / LANCE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-700">Janela Temporal Retroativa</td>
                  <td className="px-3 py-3 text-emerald-900 font-bold bg-emerald-50/40">
                    Até 30 dias (Máximo oficial)
                  </td>
                  <td className="px-3 py-3 text-slate-600 bg-emerald-50/10">
                    24 horas (Tempo real)
                  </td>
                  <td className="px-3 py-3 text-slate-600 bg-sky-50/20">
                    1 a 10 dias
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-700">Necessidade de API Key</td>
                  <td className="px-3 py-3 text-emerald-700 font-bold bg-emerald-50/40">
                    NÃO (Acesso Público Governamental)
                  </td>
                  <td className="px-3 py-3 text-emerald-700 font-bold bg-emerald-50/10">
                    NÃO (Acesso Público Governamental)
                  </td>
                  <td className="px-3 py-3 text-sky-700 font-medium bg-sky-50/20">
                    SIM (Requer MAP_KEY gratuita)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-700">Cruzamento Fundiário com CAR</td>
                  <td className="px-3 py-3 text-emerald-900 font-bold bg-emerald-50/40">
                    SIM (Sobreposição direta com matrículas CAR)
                  </td>
                  <td className="px-3 py-3 text-slate-500 bg-emerald-50/10">
                    Não integrado na API de focos
                  </td>
                  <td className="px-3 py-3 text-slate-500 bg-sky-50/20">
                    Não disponível (Cobertura global)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-700">Delimitação de Polígonos de Queima</td>
                  <td className="px-3 py-3 text-emerald-900 font-bold bg-emerald-50/40">
                    SIM (Eventos consolidados em km² e ha)
                  </td>
                  <td className="px-3 py-3 text-slate-600 bg-emerald-50/10">
                    Pontos orbitais individuais
                  </td>
                  <td className="px-3 py-3 text-slate-600 bg-sky-50/20">
                    Pontos orbitais de 375m
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-700">Cálculo de Energia Radiativa (FRP)</td>
                  <td className="px-3 py-3 text-slate-600 bg-emerald-50/40">
                    Integrado por passagem nos focos
                  </td>
                  <td className="px-3 py-3 text-slate-600 bg-emerald-50/10">
                    FRP médio por satélite
                  </td>
                  <td className="px-3 py-3 text-sky-800 font-bold bg-sky-50/20">
                    Calculado individualmente em Megawatts
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-slate-700">Aceitação Jurídica em Tribunais</td>
                  <td className="px-3 py-3 text-slate-800 font-medium bg-emerald-50/40">
                    Órgão do Ministério da Defesa / CENSIPAM
                  </td>
                  <td className="px-3 py-3 text-slate-800 font-medium bg-emerald-50/10">
                    Padrão oficial aceito pela jurisprudência
                  </td>
                  <td className="px-3 py-3 text-slate-800 font-medium bg-sky-50/20">
                    Prova pericial internacional de alta precisão
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dica de Protocolo de Instrução Pericial */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Recomendação Operacional da SENASP e Perícia Ambiental
            </h4>
            <p className="leading-relaxed">
              Ao gerar o Relatório Forense P4 no SIMIA-Verde, utilize os dados do <strong>SIPAM</strong> para atestar
              a persistência temporal do fogo (até 30 dias) e delimitar o polígono e o código do imóvel rural no CAR;
              utilize o <strong>INPE</strong> para comprovar o registro oficial nos anais do governo brasileiro;
              e vincule a coordenada métrica VIIRS de 375 metros e o FRP da <strong>NASA FIRMS</strong> para demonstrar
              o ápice de liberação de calor e o ponto de ignição primário.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
