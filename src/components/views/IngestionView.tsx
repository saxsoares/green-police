import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Upload,
  Flame,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
  Building2,
  User,
  Compass,
  Navigation,
  RefreshCw,
  Search
} from 'lucide-react';
import { CoordenadaGeo, OcorrenciaInput, TipoEntrada, SipamEventoFogo } from '../../types';
import { latLngToUtm, utmToLatLng } from '../../services/geoCalculations';
import {
  fetchFocosInpe,
  fetchIbgeMunicipios,
  reverseGeocodeMunicipio,
  fetchSipamEventos
} from '../../services/apiConnectors';
import { ESTADOS_BRASIL, normalizeUf } from '../../data/estadosBrasil';
import type { FocoInpeDetalhe } from '../../services/apiConnectors';

interface IngestionViewProps {
  onProcessIncident: (input: OcorrenciaInput) => Promise<void>;
  isLoading: boolean;
  currentInput?: OcorrenciaInput | null;
  onLoadDemoCase?: () => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({
  onProcessIncident,
  isLoading,
  currentInput,
  onLoadDemoCase
}) => {
  const [tipoEntrada, setTipoEntrada] = useState<TipoEntrada>('COORDENADA');

  // Coordenadas WGS84
  const [lat, setLat] = useState<string>(currentInput ? currentInput.coordenadas.lat.toString() : '');
  const [lng, setLng] = useState<string>(currentInput ? currentInput.coordenadas.lng.toString() : '');

  // Coordenadas UTM
  const initialUtm = currentInput
    ? latLngToUtm(currentInput.coordenadas.lat, currentInput.coordenadas.lng)
    : { easting: 0, northing: 0, zone: 23, hemisphere: 'S' as const };
  const [utmEasting, setUtmEasting] = useState<string>(currentInput ? initialUtm.easting.toString() : '');
  const [utmNorthing, setUtmNorthing] = useState<string>(currentInput ? initialUtm.northing.toString() : '');
  const [utmZone, setUtmZone] = useState<number>(initialUtm.zone);

  // Metadados
  const [operadorId, setOperadorId] = useState<string>(currentInput?.operadorId || 'PERITO-SENASP-01');
  const [municipio, setMunicipio] = useState<string>(currentInput?.municipio || '');
  const [uf, setUf] = useState<string>(currentInput?.uf || 'SP');
  const [comarca, setComarca] = useState<string>(currentInput?.comarca || '');
  const [autorizacaoStatus, setAutorizacaoStatus] = useState<
    'NAO_LOCALIZADA' | 'INDISPONIVEL_VERIFICACAO_MANUAL' | 'AUTORIZADA'
  >(currentInput?.autorizacaoQueimadaStatus || 'INDISPONIVEL_VERIFICACAO_MANUAL');
  const [autorizacaoDetalhe, setAutorizacaoDetalhe] = useState<string>(
    currentInput?.autorizacaoQueimadaDetalhe ||
      // NÃO existe integração com cadastro de queima controlada: o padrão declara a
      // pendência em vez de afirmar uma consulta que o sistema nunca fez.
      'Autorização de queima controlada NÃO VERIFICADA: o sistema não possui integração com os '
      + 'cadastros estaduais. Consultar o órgão ambiental da UF e registrar o resultado aqui.'
  );

  // GeoJSON / KML raw text
  const [geoJsonRaw, setGeoJsonRaw] = useState<string>('');
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);

  // Sincronizar campos caso a ocorrência ativa mude externamente
  useEffect(() => {
    if (currentInput) {
      setLat(currentInput.coordenadas.lat.toString());
      setLng(currentInput.coordenadas.lng.toString());
      const u = latLngToUtm(currentInput.coordenadas.lat, currentInput.coordenadas.lng);
      setUtmEasting(u.easting.toString());
      setUtmNorthing(u.northing.toString());
      setUtmZone(u.zone);
      setOperadorId(currentInput.operadorId);
      setMunicipio(currentInput.municipio);
      setUf(currentInput.uf);
      setComarca(currentInput.comarca);
      setAutorizacaoStatus(currentInput.autorizacaoQueimadaStatus);
      setAutorizacaoDetalhe(currentInput.autorizacaoQueimadaDetalhe);
    }
  }, [currentInput]);

  // Limpar formulário para cadastro de nova ocorrência do zero
  const handleResetForm = () => {
    setLat('');
    setLng('');
    setUtmEasting('');
    setUtmNorthing('');
    setMunicipio('');
    setComarca('');
    setGeoJsonRaw('');
    setArquivoNome(null);
    setAutorizacaoStatus('INDISPONIVEL_VERIFICACAO_MANUAL');
    setAutorizacaoDetalhe(
      'Autorização de queima controlada NÃO VERIFICADA: o sistema não possui integração com os '
      + 'cadastros estaduais. Consultar o órgão ambiental da UF e registrar o resultado aqui.'
    );
  };

  // Estados de feedback de API
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isLoadingFocosInpe, setIsLoadingFocosInpe] = useState<boolean>(false);
  const [focosInpeList, setFocosInpeList] = useState<FocoInpeDetalhe[]>([]);
  const [focosInpeMsg, setFocosInpeMsg] = useState<string | null>(null);

  // Estados SIPAM Painel do Fogo (Eventos consolidados até 30 dias)
  const [isLoadingEventosSipam, setIsLoadingEventosSipam] = useState<boolean>(false);
  const [eventosSipamList, setEventosSipamList] = useState<SipamEventoFogo[]>([]);
  const [eventosSipamMsg, setEventosSipamMsg] = useState<string | null>(null);
  const [municipiosIbge, setMunicipiosIbge] = useState<Array<{ id: number; nome: string; uf?: string }>>([]);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState<boolean>(false);
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('');
  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState<boolean>(false);

  // Carregar lista de municípios oficiais do IBGE para a UF selecionada
  useEffect(() => {
    let cancel = false;
    async function loadMunicipios() {
      setIsLoadingMunicipios(true);
      try {
        const list = await fetchIbgeMunicipios(uf);
        if (!cancel) {
          setMunicipiosIbge(list);
        }
      } finally {
        if (!cancel) setIsLoadingMunicipios(false);
      }
    }
    loadMunicipios();
    return () => {
      cancel = true;
    };
  }, [uf]);

  // Sincronizar UTM quando Lat/Lng mudar
  const handleLatLngChange = (newLat: string, newLng: string) => {
    setLat(newLat);
    setLng(newLng);
    const nLat = parseFloat(newLat);
    const nLng = parseFloat(newLng);
    if (!isNaN(nLat) && !isNaN(nLng) && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180) {
      const u = latLngToUtm(nLat, nLng);
      setUtmEasting(u.easting.toString());
      setUtmNorthing(u.northing.toString());
      setUtmZone(u.zone);
    }
  };

  // Sincronizar Lat/Lng quando UTM mudar
  const handleUtmChange = (newEasting: string, newNorthing: string, newZone: number) => {
    setUtmEasting(newEasting);
    setUtmNorthing(newNorthing);
    setUtmZone(newZone);
    const e = parseFloat(newEasting);
    const n = parseFloat(newNorthing);
    if (!isNaN(e) && !isNaN(n)) {
      const geo = utmToLatLng({
        easting: e,
        northing: n,
        zone: newZone,
        hemisphere: 'S'
      });
      setLat(geo.lat.toString());
      setLng(geo.lng.toString());
    }
  };

  // Resolver Município / Comarca automaticamente
  const handleAutoGeocode = async () => {
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);
    if (isNaN(nLat) || isNaN(nLng)) return;

    setIsGeocoding(true);
    try {
      const info = await reverseGeocodeMunicipio({ lat: nLat, lng: nLng });
      setMunicipio(info.municipio);
      setUf(info.uf);
      setComarca(info.comarca);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Usar GPS atual do dispositivo
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const curLat = pos.coords.latitude.toFixed(6);
        const curLng = pos.coords.longitude.toFixed(6);
        handleLatLngChange(curLat, curLng);
        const info = await reverseGeocodeMunicipio({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMunicipio(info.municipio);
        setUf(info.uf);
        setComarca(info.comarca);
      },
      err => {
        alert(`Não foi possível obter a localização: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  // Buscar Focos Reais de Calor no INPE BDQueimadas
  const handleBuscarFocosReaisInpe = async () => {
    setIsLoadingFocosInpe(true);
    setFocosInpeMsg(null);
    try {
      const res = await fetchFocosInpe({ estado: uf || 'SP', janela: '48h', conjunto: 'todosats', limite: 300 });
      setFocosInpeList(res.focos);
      if (!res.sucesso) {
        // Falha de consulta NÃO é "nenhum foco": o operador precisa da distinção.
        setFocosInpeMsg(`CONSULTA NÃO REALIZADA — ${res.mensagem || 'fonte indisponível'}. `
          + (res.orientacaoOperador || 'A ausência de focos aqui não significa ausência de fogo.'));
      } else if (res.focos.length === 0) {
        setFocosInpeMsg(res.mensagem || `O INPE respondeu à consulta e não reportou focos em ${uf || 'SP'} nas últimas 48h.`);
      } else if (res.truncado) {
        setFocosInpeMsg(`Exibindo ${res.quantidade} de ${res.totalNaFonte} focos retornados pela fonte (resultado limitado).`);
      }
    } catch {
      setFocosInpeMsg('Falha de conexão com o GeoServer do INPE. Consulta NÃO realizada.');
    } finally {
      setIsLoadingFocosInpe(false);
    }
  };

  // Selecionar Foco Real do INPE
  // Tipado (era `any`, o que escondia a mudança de shape do conector do INPE).
  const handleSelectFocoReal = async (foco: FocoInpeDetalhe) => {
    handleLatLngChange(foco.latitude.toFixed(6), foco.longitude.toFixed(6));
    setIsGeocoding(true);
    try {
      const info = await reverseGeocodeMunicipio({ lat: foco.latitude, lng: foco.longitude });
      // O município da própria detecção do INPE é preferido; a geocodificação é o reforço.
      setMunicipio(foco.municipio ?? info.municipio);
      setUf(info.uf);
      setComarca(info.comarca);
      setAutorizacaoStatus('INDISPONIVEL_VERIFICACAO_MANUAL');
      setAutorizacaoDetalhe(
        `Detecção orbital INPE BDQueimadas`
        + `${foco.idFocoBdq ? ` (foco oficial nº ${foco.idFocoBdq})` : ''}`
        + `${foco.satelite ? ` via ${foco.satelite}` : ''}`
        + `${foco.dataHoraGmt ? ` em ${foco.dataHoraGmt}` : ' — horário não informado pela fonte'}.`
        + `${typeof foco.frp === 'number' ? ` FRP ${foco.frp} MW.` : ''}`
        + `${foco.diasSemChuva !== null ? ` ${foco.diasSemChuva} dia(s) sem chuva no local.` : ''}`
        + ' Autorização de queima controlada NÃO VERIFICADA: consultar o órgão ambiental da UF.'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // Buscar Eventos de Fogo Consolidados no SIPAM Painel do Fogo (até 30 dias no máximo)
  const handleBuscarEventosSipam = async () => {
    setIsLoadingEventosSipam(true);
    setEventosSipamMsg(null);
    try {
      const res = await fetchSipamEventos({ uf: uf || 'SP', dias: 30 });
      setEventosSipamList(res.eventos);
      if (res.eventos.length === 0) {
        setEventosSipamMsg(`Nenhum evento de fogo registrado no SIPAM para o estado de ${uf || 'SP'} nos últimos 30 dias.`);
      }
    } catch {
      setEventosSipamMsg('Falha de conexão com os servidores do SIPAM Painel do Fogo.');
    } finally {
      setIsLoadingEventosSipam(false);
    }
  };

  // Selecionar Evento de Fogo do SIPAM
  const handleSelectEventoSipam = async (ev: SipamEventoFogo) => {
    const latStr = ev.latitude.toFixed(6);
    const lngStr = ev.longitude.toFixed(6);
    handleLatLngChange(latStr, lngStr);
    setIsGeocoding(true);
    try {
      const info = await reverseGeocodeMunicipio({ lat: ev.latitude, lng: ev.longitude });
      setMunicipio(ev.municipio || info.municipio);
      setUf(info.uf);
      setComarca(info.comarca);
      setAutorizacaoStatus('INDISPONIVEL_VERIFICACAO_MANUAL');
      const areaDesc = typeof ev.area_total_evento === 'number'
        ? `${ev.area_total_evento.toFixed(2)} km² (~${(ev.area_total_evento * 100).toFixed(0)} ha)`
        : 'não informada pela fonte';
      // Persistência ausente NÃO vira "1 dia": seria inventar a duração do evento.
      const persistDesc = typeof ev.persistencia_dias === 'number'
        ? `${ev.persistencia_dias} dia(s)`
        : 'não informada pela fonte';
      setAutorizacaoDetalhe(
        `Evento de Fogo #${ev.id_evento} (${ev.status_evento}) via SIPAM Painel do Fogo (CENSIPAM/MD). `
        + `Área: ${areaDesc}. Persistência: ${persistDesc}. `
        + 'Autorização de queima controlada NÃO VERIFICADA: consultar o órgão ambiental da UF.'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  // Selecionar Município da lista do IBGE
  const handleSelectIbgeMunicipio = (nomeMun: string) => {
    setMunicipio(nomeMun);
    setComarca(`Comarca de ${nomeMun} - TJ${uf}`);
    setShowMunicipioDropdown(false);
    setFiltroMunicipio('');
  };

  // Processar arquivo GeoJSON / KML
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setArquivoNome(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setGeoJsonRaw(text);

      try {
        if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          let extractedCoords: [number, number] | null = null;
          if (json.type === 'FeatureCollection' && json.features?.length > 0) {
            const geom = json.features[0].geometry;
            if (geom.type === 'Point') {
              extractedCoords = geom.coordinates;
            } else if (geom.type === 'Polygon' && geom.coordinates[0]?.length > 0) {
              extractedCoords = geom.coordinates[0][0];
            }
          } else if (json.type === 'Feature' && json.geometry) {
            if (json.geometry.type === 'Point') {
              extractedCoords = json.geometry.coordinates;
            }
          }

          if (extractedCoords) {
            const [lonVal, latVal] = extractedCoords;
            handleLatLngChange(latVal.toFixed(6), lonVal.toFixed(6));
          }
        }
      } catch (err) {
        console.warn('Erro ao interpretar GeoJSON anexado:', err);
      }
    };
    reader.readAsText(file);
  };

  // Submissão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);
    if (isNaN(nLat) || isNaN(nLng)) {
      alert('Coordenadas inválidas. Por favor insira valores numéricos para latitude e longitude.');
      return;
    }

    const payload: OcorrenciaInput = {
      id: `SIMIA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestampUtc: new Date().toISOString(),
      operadorId: operadorId || 'PERITO-SENASP-01',
      tipoEntrada,
      coordenadas: {
        lat: nLat,
        lng: nLng
      },
      municipio: municipio || 'Município sob verificação',
      uf: uf || 'SP',
      comarca: comarca || `Comarca de ${municipio || 'Jurisdição Local'} - TJ${uf || 'SP'}`,
      origemDescricao: arquivoNome
        ? `Ingestão via arquivo vetorial ${arquivoNome}`
        : `Ingestão pericial de foco de calor em ${nLat.toFixed(5)}, ${nLng.toFixed(5)}`,
      autorizacaoQueimadaStatus: autorizacaoStatus,
      autorizacaoQueimadaDetalhe: autorizacaoDetalhe
    };

    await onProcessIncident(payload);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Título da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-sky-600" />
            Ingestão Pericial de Foco de Calor & Metadados Operacionais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Insira os dados geográficos do foco para enriquecimento em tempo real via Open-Meteo, INPE BDQueimadas, OSM Overpass e SIGAMgeo.
          </p>
        </div>

        {/* Badge do Protocolo Forense P4 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          <span>Protocolo Forense P4: Dados Reais Auditados</span>
        </div>
      </div>

      {/* Painel de Integrações em Tempo Real: INPE BDQueimadas & Localização */}
      <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Database className="w-4 h-4 text-sky-600" />
            <span>Consultar Detecções Orbitais Reais (INPE / Satélites)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="Obter coordenadas geográficas pelo GPS do aparelho"
            >
              <Navigation className="w-3 h-3 text-sky-600" />
              <span>Usar GPS Atual</span>
            </button>
            <button
              type="button"
              onClick={handleBuscarFocosReaisInpe}
              disabled={isLoadingFocosInpe}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 font-medium border border-sky-200 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 text-sky-600 ${isLoadingFocosInpe ? 'animate-spin' : ''}`} />
              <span>{isLoadingFocosInpe ? 'Consultando INPE...' : `Focos INPE (${uf || 'SP'})`}</span>
            </button>
            <button
              type="button"
              onClick={handleBuscarEventosSipam}
              disabled={isLoadingEventosSipam}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium border border-emerald-200 transition-colors"
              title="Consultar eventos de fogo consolidados no SIPAM Painel do Fogo (últimos 30 dias no máximo)"
            >
              <Flame className={`w-3 h-3 text-emerald-600 ${isLoadingEventosSipam ? 'animate-spin' : ''}`} />
              <span>{isLoadingEventosSipam ? 'Consultando SIPAM...' : `Eventos SIPAM 30d (${uf || 'SP'})`}</span>
            </button>
          </div>
        </div>

        {/* Retorno da Consulta ao SIPAM */}
        {eventosSipamMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center justify-between">
            <span>{eventosSipamMsg}</span>
            <button
              type="button"
              onClick={() => setEventosSipamMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 text-[10px]"
            >
              Fechar ✕
            </button>
          </div>
        )}

        {/* Lista de Eventos de Fogo Consolidados do SIPAM (Até 30 dias) */}
        {eventosSipamList.length > 0 && (
          <div className="space-y-1.5 p-3 bg-emerald-50/40 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between text-[11px] text-emerald-900 font-semibold">
              <span>{eventosSipamList.length} evento(s) de fogo consolidados no SIPAM ({uf || 'SP'} - até 30 dias). Clique para preencher:</span>
              <button
                type="button"
                onClick={() => setEventosSipamList([])}
                className="text-emerald-700 hover:text-emerald-900 text-[10px]"
              >
                Ocultar lista
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {eventosSipamList.slice(0, 9).map(ev => (
                <button
                  key={ev.id_evento}
                  type="button"
                  onClick={() => handleSelectEventoSipam(ev)}
                  className="p-2 text-left bg-white hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-xs transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-800">
                      {ev.municipio || uf || 'SP'}
                    </strong>
                    <span className="text-[10px] px-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                      #{ev.id_evento} ({ev.status_evento})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Lat: {ev.latitude.toFixed(4)} | Lng: {ev.longitude.toFixed(4)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-amber-700 font-mono mt-0.5">
                    <span>Área: {ev.area_total_evento ? `${ev.area_total_evento.toFixed(1)} km²` : '—'}</span>
                    <span className="text-slate-600">{ev.persistencia_dias || 1}d duração</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Retorno da Consulta ao INPE */}
        {focosInpeMsg && (
          <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200 flex items-center justify-between">
            <span>{focosInpeMsg}</span>
            <button
              type="button"
              onClick={() => setFocosInpeMsg(null)}
              className="text-slate-400 hover:text-slate-600 text-[10px]"
            >
              Fechar ✕
            </button>
          </div>
        )}

        {focosInpeList.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-500 font-medium">
              {focosInpeList.length} foco(s) de satélite real(is) identificado(s) no INPE BDQueimadas. Clique para carregar as coordenadas:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {focosInpeList.slice(0, 9).map((f, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectFocoReal(f)}
                  className="p-2 text-left bg-sky-50/40 hover:bg-sky-100/70 border border-sky-200/80 rounded-lg text-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-800">{f.municipio ?? 'município não informado'}</strong>
                    <span className="text-[10px] text-sky-700 font-mono">{f.satelite ?? '—'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Lat: {f.latitude.toFixed(4)} | Lng: {f.longitude.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {f.dataHoraGmt ? `${f.dataHoraGmt.slice(0, 16).replace('T', ' ')} UTC` : 'horário não informado'}
                  </div>
                  {typeof f.frp === 'number' && (
                    <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                      FRP: {f.frp.toFixed(1)} MW
                    </div>
                  )}
                  {f.bioma && (
                    <div className="text-[10px] text-emerald-700 mt-0.5">{f.bioma}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Coordenadas & Formato de Entrada */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-sky-100 shadow-xs space-y-4">
            {/* Seletor de Tipo de Entrada */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Formato de Georreferência</span>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTipoEntrada('COORDENADA')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    tipoEntrada === 'COORDENADA'
                      ? 'bg-white text-sky-800 font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lat / Long (WGS84)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEntrada('UTM')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    tipoEntrada === 'UTM'
                      ? 'bg-white text-sky-800 font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  UTM (SIRGAS 2000)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEntrada('GEOJSON')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    tipoEntrada === 'GEOJSON'
                      ? 'bg-white text-sky-800 font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  GeoJSON / KML
                </button>
              </div>
            </div>

            {/* Inputs de Coordenadas Lat/Long */}
            {tipoEntrada === 'COORDENADA' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Latitude Decimal (WGS84)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={lat}
                        onChange={e => handleLatLngChange(e.target.value, lng)}
                        placeholder="-21.1767"
                        required
                        className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">°S</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Longitude Decimal (WGS84)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={lng}
                        onChange={e => handleLatLngChange(lat, e.target.value)}
                        placeholder="-47.8208"
                        required
                        className="w-full pl-3 pr-8 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">°W</span>
                    </div>
                  </div>
                </div>

                {/* Conversão em Tempo Real para UTM */}
                <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span>Correspondência UTM (SIRGAS 2000):</span>
                  </div>
                  <div className="font-mono text-sky-900 font-medium">
                    Zona {utmZone}S | E: {utmEasting} m | N: {utmNorthing} m
                  </div>
                </div>
              </div>
            )}

            {/* Inputs de Coordenadas UTM */}
            {tipoEntrada === 'UTM' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Easting (X em metros)
                    </label>
                    <input
                      type="text"
                      value={utmEasting}
                      onChange={e => handleUtmChange(e.target.value, utmNorthing, utmZone)}
                      placeholder="207430"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Northing (Y em metros)
                    </label>
                    <input
                      type="text"
                      value={utmNorthing}
                      onChange={e => handleUtmChange(utmEasting, e.target.value, utmZone)}
                      placeholder="7655820"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Fuso UTM (SP = 22S / 23S)
                    </label>
                    <select
                      value={utmZone}
                      onChange={e => handleUtmChange(utmEasting, utmNorthing, parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none bg-white"
                    >
                      <option value={22}>Zona 22S (Oeste Paulista)</option>
                      <option value={23}>Zona 23S (Capital, Leste, Mantiqueira)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    <span>WGS84 Convertido:</span>
                  </div>
                  <div className="font-mono text-sky-900 font-medium">
                    Lat: {lat} | Lng: {lng}
                  </div>
                </div>
              </div>
            )}

            {/* Ingestão GeoJSON / KML */}
            {tipoEntrada === 'GEOJSON' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-700">
                  Carregar arquivo vetorial (.geojson, .json ou .kml)
                </label>
                <div className="border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-lg p-5 text-center bg-sky-50/20 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".geojson,.json,.kml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload-input"
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                    <Upload className="w-6 h-6 text-sky-600 mx-auto" />
                    <div className="text-xs text-slate-600">
                      <span className="font-medium text-sky-700">Clique para selecionar</span> ou arraste o arquivo aqui
                    </div>
                    <p className="text-[10px] text-slate-400">Suporta polígonos de glebas, focos FIRMS ou manchas prévias</p>
                  </label>
                </div>

                {arquivoNome && (
                  <div className="text-xs text-emerald-700 flex items-center gap-1.5 p-2 bg-emerald-50 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Arquivo carregado: <strong>{arquivoNome}</strong> (Centróide identificado: {lat}, {lng})</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Ou cole o conteúdo GeoJSON textual:
                  </label>
                  <textarea
                    rows={3}
                    value={geoJsonRaw}
                    onChange={e => setGeoJsonRaw(e.target.value)}
                    placeholder='{"type": "FeatureCollection", "features": [...]}'
                    className="w-full p-2.5 text-[11px] font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Botão de Resolução Automática de Município via API */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Jurisdição e Comarca:</span>
              <button
                type="button"
                onClick={handleAutoGeocode}
                disabled={isGeocoding}
                className="text-sky-700 hover:text-sky-900 font-medium inline-flex items-center gap-1 transition-colors"
              >
                {isGeocoding ? 'Consultando IBGE/Nominatim...' : '↻ Resolver Município via Coordenada'}
              </button>
            </div>
          </div>

          {/* Coluna Direita: Metadados Institucionais & Verificação SEMIL */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-sky-100 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              Metadados Institucionais & Verificação Cadastral
            </h3>

            {/* Operador ID */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                ID do Operador / Perito
              </label>
              <input
                type="text"
                value={operadorId}
                onChange={e => setOperadorId(e.target.value)}
                placeholder="PERITO-SENASP-01 / PCSP-042"
                required
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Município e UF oficiais do IBGE */}
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Município (IBGE {uf})
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {isLoadingMunicipios
                        ? 'Consultando IBGE...'
                        : municipiosIbge.length > 0
                        ? `${municipiosIbge.length} cidades carregadas`
                        : 'Carregando...'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={municipio}
                      onChange={e => {
                        setMunicipio(e.target.value);
                        setFiltroMunicipio(e.target.value);
                        setShowMunicipioDropdown(true);
                      }}
                      onFocus={() => setShowMunicipioDropdown(true)}
                      placeholder={`Buscar município em ${uf}...`}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado (UF)
                  </label>
                  <select
                    value={uf}
                    onChange={e => {
                      const novaUf = e.target.value;
                      setUf(novaUf);
                      setFiltroMunicipio('');
                      setShowMunicipioDropdown(true);
                      if (municipio) {
                        setComarca(`Comarca de ${municipio} - TJ${novaUf}`);
                      }
                    }}
                    className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none cursor-pointer"
                  >
                    {ESTADOS_BRASIL.map(est => (
                      <option key={est.sigla} value={est.sigla}>
                        {est.sigla} — {est.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown dinâmico de municípios oficiais do IBGE para o Estado Selecionado */}
              {showMunicipioDropdown && municipiosIbge.length > 0 && (
                <div className="absolute z-30 mt-1 w-full sm:w-2/3 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50">
                    <span>Cidades de {uf} cadastradas no IBGE:</span>
                    <button
                      type="button"
                      onClick={() => setShowMunicipioDropdown(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕ Fechar
                    </button>
                  </div>
                  {municipiosIbge
                    .filter(m => !filtroMunicipio || m.nome.toLowerCase().includes(filtroMunicipio.toLowerCase()))
                    .slice(0, 15)
                    .map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectIbgeMunicipio(m.nome)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 text-slate-700 border-b border-slate-50 last:border-0 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-medium">{m.nome}</span>
                        <span className="text-[10px] text-slate-400 font-mono">IBGE: {m.id}</span>
                      </button>
                    ))}
                  {municipiosIbge.filter(m => !filtroMunicipio || m.nome.toLowerCase().includes(filtroMunicipio.toLowerCase())).length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Nenhum município de {uf} encontrado para "{filtroMunicipio}".
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Comarca Judiciária</label>
              <input
                type="text"
                value={comarca}
                onChange={e => setComarca(e.target.value)}
                placeholder="Comarca da jurisdição territorial"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Verificação de Queimada Controlada */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Autorização de Queimada (SEMIL / CETESB)
              </label>
              <select
                value={autorizacaoStatus}
                onChange={e => setAutorizacaoStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none bg-white mb-2"
              >
                <option value="NAO_LOCALIZADA">NENHUMA AUTORIZAÇÃO LOCALIZADA (Queima Ilícita Presumida)</option>
                <option value="INDISPONIVEL_VERIFICACAO_MANUAL">INDISPONÍVEL — Verificação manual obrigatória</option>
                <option value="AUTORIZADA">AUTORIZADA COM CONDICIONANTES (Análise de conformidade)</option>
              </select>
              <textarea
                rows={2}
                value={autorizacaoDetalhe}
                onChange={e => setAutorizacaoDetalhe(e.target.value)}
                placeholder="Detalhes ou número do processo no banco da SEMIL..."
                className="w-full p-2 text-[11px] rounded-lg border border-slate-200 focus:border-sky-500 outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Botão de Ação Principal e Controles Auxiliares */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Limpar Campos
            </button>
            {onLoadDemoCase && (
              <button
                type="button"
                onClick={onLoadDemoCase}
                className="px-4 py-2.5 text-xs text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
              >
                Carregar Exemplo Demonstrativo
              </button>
            )}
          </div>

          <button
            id="btn-process-incident"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processando Integrações Reais & Modelagem Rothermel...</span>
              </>
            ) : (
              <>
                <span>Executar Análise Forense com Dados Reais</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
