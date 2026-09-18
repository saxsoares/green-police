import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Wind,
  Download,
  Flame,
  Shield,
  Eye,
  Maximize2,
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';
import { OcorrenciaCompleta } from '../../types';
import { exportManchasGeoJson } from '../../services/geoCalculations';

interface TacticalMapViewProps {
  ocorrencia: OcorrenciaCompleta;
}

export const TacticalMapView: React.FC<TacticalMapViewProps> = ({ ocorrencia }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Estados de visibilidade de camadas
  const [show1h, setShow1h] = useState(true);
  const [show3h, setShow3h] = useState(true);
  const [show6h, setShow6h] = useState(true);
  const [showApp, setShowApp] = useState(true);
  const [showCar, setShowCar] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [baseMapType, setBaseMapType] = useState<'osm' | 'topo' | 'satellite'>('osm');

  const { input, projecao, meteo, contexto } = ocorrencia;
  const centerLat = input.coordenadas.lat;
  const centerLng = input.coordenadas.lng;

  // Inicializar o mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      mapInstanceRef.current = map;
      layersGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        // O grupo de camadas pertencia ao mapa removido: manter a referência deixaria
        // um objeto órfão que o efeito de camadas tentaria reutilizar.
        layersGroupRef.current = null;
      }
    };
  }, []);

  // Atualizar centro do mapa quando o foco mudar
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], 14);
    }
  }, [centerLat, centerLng]);

  // Atualizar camadas vetoriais e polígonos
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Gerenciar Camada Base
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (baseMapType === 'topo') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    } else if (baseMapType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    // Limpar camadas vetoriais anteriores
    if (layersGroupRef.current) {
      layersGroupRef.current.clearLayers();
    }
    const group = layersGroupRef.current || L.layerGroup().addTo(map);

    // 1. Marcador do Ponto de Ignição / Foco de Calor
    const fireIcon = L.divIcon({
      className: 'fire-marker-custom',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          background: #ef4444;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: bold;
        ">🔥</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const fireMarker = L.marker([centerLat, centerLng], { icon: fireIcon }).bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
        <strong style="color: #b91c1c;">Vértice de Ignição (Foco de Calor)</strong><br/>
        <b>ID:</b> ${input.id}<br/>
        <b>Coordenadas:</b> ${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}<br/>
        <b>Horário UTC:</b> ${input.timestampUtc}<br/>
        <b>Sensor:</b> ${ocorrencia.focosSat[0]?.sensor || 'não informado'}<br/>
        <b>FRP:</b> ${typeof ocorrencia.focosSat[0]?.frpMw === 'number' ? `${ocorrencia.focosSat[0].frpMw} MW` : 'não informado pela fonte'}
      </div>
    `);
    group.addLayer(fireMarker);

    /*
     * 2. Limite da Propriedade (CAR) e 3. Faixa de APP
     *
     * REMOVIDOS. As duas camadas desenhavam GEOMETRIAS INVENTADAS: um quadrilátero
     * arbitrário em volta do foco rotulado "Cadastro Ambiental Rural" e uma polilinha
     * arbitrária rotulada "Área de Preservação Permanente", ambas com popup de aparência
     * oficial. O sistema não possui a geometria real de nenhuma das duas — o SICAR não
     * está integrado e o Overpass informa apenas presença de feição hídrica no raio,
     * não o traçado da margem.
     *
     * Um perímetro falso de CAR num mapa tático leva à identificação do proprietário
     * errado; uma faixa falsa de APP sustenta tipificação do Art. 38 da Lei 9.605/98
     * sobre geometria fictícia. Enquanto não houver a geometria real das fontes
     * (SICAR e base hidrográfica da ANA), o mapa declara a ausência em vez de desenhar.
     *
     * Os controles showCar/showApp passam a exibir o aviso abaixo.
     */
    if (showCar || showApp) {
      const camadas: string[] = [];
      if (showCar) camadas.push('Limite CAR do imóvel');
      if (showApp) camadas.push('Faixa de APP');

      const aviso = L.marker([centerLat, centerLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:#fffbeb;border:1px solid #fcd34d;color:#92400e;
                   padding:6px 10px;border-radius:8px;font-family:sans-serif;font-size:11px;
                   line-height:1.4;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15);">
                   <b>Camada indisponível:</b> ${camadas.join(' · ')}
                 </div>`,
          iconAnchor: [0, -18]
        }),
        interactive: true,
        keyboard: false
      }).bindPopup(`
        <div style="font-size:12px;max-width:280px;line-height:1.5;">
          <strong style="color:#92400e;">Geometria não disponível</strong><br/><br/>
          O SIMIA-Verde não possui o traçado real do perímetro CAR nem da faixa de APP para
          esta coordenada. Nenhum polígono é desenhado para não induzir conclusão sobre
          limite de propriedade ou sobreposição com APP.<br/><br/>
          <b>CAR:</b> ${contexto.car.valor.codigoCar}<br/>
          <b>APP:</b> ${contexto.app.confiabilidade === 'INDISPONIVEL' ? 'não verificada' : contexto.app.valor.tipoApp}<br/><br/>
          Obtenha os polígonos oficiais no SICAR (car.gov.br) e na base hidrográfica da ANA.
        </div>
      `);
      group.addLayer(aviso);
    }

    // 4. Manchas Elípticas de Propagação (6h, 3h, 1h)
    // Mancha 6h (vermelho)
    if (show6h) {
      const m6Coords = projecao.manchas.t6h.coordenadasPoligono.map(p => [p.lat, p.lng] as [number, number]);
      const poly6h = L.polygon(m6Coords, {
        color: '#dc2626',
        weight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.15
      }).bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: #b91c1c;">Projeção de Propagação T + 6 Horas</strong><br/>
          <b>Área Estimada:</b> ${projecao.manchas.t6h.areaHectares} hectares<br/>
          <b>Perímetro:</b> ${projecao.manchas.t6h.perimetroKm} km<br/>
          <b>Eixo Maior:</b> ${projecao.manchas.t6h.eixoMaiorMetros} m<br/>
          <b>Avanço:</b> ${projecao.manchas.t6h.azimutePropagacaoGraus}°
        </div>
      `);
      group.addLayer(poly6h);
    }

    // Mancha 3h (laranja)
    if (show3h) {
      const m3Coords = projecao.manchas.t3h.coordenadasPoligono.map(p => [p.lat, p.lng] as [number, number]);
      const poly3h = L.polygon(m3Coords, {
        color: '#ea580c',
        weight: 1.5,
        fillColor: '#f97316',
        fillOpacity: 0.25
      }).bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: #c2410c;">Projeção de Propagação T + 3 Horas</strong><br/>
          <b>Área Estimada:</b> ${projecao.manchas.t3h.areaHectares} hectares<br/>
          <b>Perímetro:</b> ${projecao.manchas.t3h.perimetroKm} km<br/>
          <b>Eixo Maior:</b> ${projecao.manchas.t3h.eixoMaiorMetros} m
        </div>
      `);
      group.addLayer(poly3h);
    }

    // Mancha 1h (âmbar)
    if (show1h) {
      const m1Coords = projecao.manchas.t1h.coordenadasPoligono.map(p => [p.lat, p.lng] as [number, number]);
      const poly1h = L.polygon(m1Coords, {
        color: '#d97706',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.35
      }).bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: #b45309;">Projeção de Propagação T + 1 Hora</strong><br/>
          <b>Área Estimada:</b> ${projecao.manchas.t1h.areaHectares} hectares<br/>
          <b>Perímetro:</b> ${projecao.manchas.t1h.perimetroKm} km<br/>
          <b>Eixo Maior:</b> ${projecao.manchas.t1h.eixoMaiorMetros} m
        </div>
      `);
      group.addLayer(poly1h);
    }

    // 5. Vetor da Direção do Vento
    if (showWind) {
      const rad = (projecao.manchas.t1h.azimutePropagacaoGraus * Math.PI) / 180;
      const windLen = 0.008;
      const endLat = centerLat + windLen * Math.cos(rad);
      const endLng = centerLng + windLen * Math.sin(rad);

      const windLine = L.polyline(
        [
          [centerLat, centerLng],
          [endLat, endLng]
        ],
        {
          color: '#0284c7',
          weight: 3,
          dashArray: '6, 6'
        }
      ).bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: #0369a1;">Vetor Predominante do Vento</strong><br/>
          <b>Origem do Vento:</b> ${meteo.ventoDirecaoTexto} (${meteo.ventoDirecaoGraus}°)<br/>
          <b>Direção de Propagação:</b> ${projecao.manchas.t1h.azimutePropagacaoGraus}°<br/>
          <b>Velocidade:</b> ${meteo.ventoVelocidadeKmH} km/h
        </div>
      `);
      group.addLayer(windLine);
    }
  }, [
    centerLat,
    centerLng,
    show1h,
    show3h,
    show6h,
    showApp,
    showCar,
    showWind,
    baseMapType,
    projecao,
    meteo,
    contexto
  ]);

  // Download do GeoJSON das manchas
  const handleDownloadGeoJson = () => {
    const geoJsonContent = exportManchasGeoJson(projecao, input.coordenadas, input.id);
    const blob = new Blob([geoJsonContent], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manchas_${input.id}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Barra de Controles e Legenda Superior */}
      <div className="bg-white border-b border-sky-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Alternador de Mapa Base */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Mapa Base:
          </span>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setBaseMapType('osm')}
              className={`px-2.5 py-1 rounded-md text-[11px] ${
                baseMapType === 'osm' ? 'bg-white text-sky-800 font-medium shadow-xs' : 'text-slate-600'
              }`}
            >
              Padrão
            </button>
            <button
              type="button"
              onClick={() => setBaseMapType('topo')}
              className={`px-2.5 py-1 rounded-md text-[11px] ${
                baseMapType === 'topo' ? 'bg-white text-sky-800 font-medium shadow-xs' : 'text-slate-600'
              }`}
            >
              Relevo / Topo
            </button>
            <button
              type="button"
              onClick={() => setBaseMapType('satellite')}
              className={`px-2.5 py-1 rounded-md text-[11px] ${
                baseMapType === 'satellite' ? 'bg-white text-sky-800 font-medium shadow-xs' : 'text-slate-600'
              }`}
            >
              Satélite
            </button>
          </div>
        </div>

        {/* Toggles de Camadas Geoespaciais */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 cursor-pointer text-[11px]">
            <input type="checkbox" checked={show1h} onChange={e => setShow1h(e.target.checked)} className="rounded text-amber-600 focus:ring-0" />
            <span>Mancha 1h ({projecao.manchas.t1h.areaHectares} ha)</span>
          </label>
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-800 border border-orange-200 cursor-pointer text-[11px]">
            <input type="checkbox" checked={show3h} onChange={e => setShow3h(e.target.checked)} className="rounded text-orange-600 focus:ring-0" />
            <span>Mancha 3h ({projecao.manchas.t3h.areaHectares} ha)</span>
          </label>
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 cursor-pointer text-[11px]">
            <input type="checkbox" checked={show6h} onChange={e => setShow6h(e.target.checked)} className="rounded text-rose-600 focus:ring-0" />
            <span>Mancha 6h ({projecao.manchas.t6h.areaHectares} ha)</span>
          </label>
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer text-[11px]">
            <input type="checkbox" checked={showApp} onChange={e => setShowApp(e.target.checked)} className="rounded text-emerald-600 focus:ring-0" />
            <span>APP Hídrica</span>
          </label>
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200 cursor-pointer text-[11px]">
            <input type="checkbox" checked={showCar} onChange={e => setShowCar(e.target.checked)} className="rounded text-sky-600 focus:ring-0" />
            <span>CAR ({contexto.car.valor.codigoCar.slice(0, 15)}...)</span>
          </label>
        </div>

        {/* Botão de Exportação GeoJSON */}
        <button
          type="button"
          onClick={handleDownloadGeoJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-xs transition-colors"
          title="Exportar polígonos das manchas elípticas no formato GeoJSON padrão"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar manchas.geojson</span>
        </button>
      </div>

      {/* Área do Mapa e Painel Flutuante */}
      <div className="flex-1 relative overflow-hidden">
        {/* Contêiner Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full z-0"></div>

        {/* Card Flutuante de Indicadores do Modelo Rothermel */}
        <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-sky-100 shadow-md text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-600" />
              Modelo Elíptico de Rothermel / Alexander
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-semibold">
              Risco: {projecao.nivelRisco}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Taxa de Avanço (Head):</span>
              <span className="font-mono font-medium text-slate-800">{projecao.taxaPropagacaoMetrosHora} m/h</span>
            </div>
            <div>
              <span className="text-slate-400 block">Intensidade Linha (Byram):</span>
              <span className="font-mono font-medium text-slate-800">{projecao.intensidadeEstimadaKwM} kW/m</span>
            </div>
            <div>
              <span className="text-slate-400 block">Vetor de Propagação:</span>
              <span className="font-mono font-medium text-slate-800">
                {projecao.manchas.t1h.azimutePropagacaoGraus}° (Sotavento)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Combustível / Bioma:</span>
              <span className="font-medium text-slate-800 truncate block">
                {contexto.vegetacaoNativa.valor.estagioSucessional} ({contexto.vegetacaoNativa.valor.bioma})
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 leading-snug flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
            <span>{projecao.ressalvaForense}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
