/**
 * SIMIA-Verde — Sistema Integrado de Monitoramento, Inteligência Ambiental e Instrução Forense
 * SENASP / Ministério da Justiça e Segurança Pública
 * Arquitetura Operacional com Dados Reais e Integrações Governamentais
 */

import React, { useEffect, useState, useMemo } from 'react';
import { ActiveTab, Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { IngestionView } from './components/views/IngestionView';
import { SatellitesView } from './components/views/SatellitesView';
import { TacticalMapView } from './components/views/TacticalMapView';
import { ReportView } from './components/views/ReportView';
import { DirectivesView } from './components/views/DirectivesView';
import { CustodyView } from './components/views/CustodyView';
import { ApiConnectorsView } from './components/views/ApiConnectorsView';
import { DecisionsView } from './components/views/DecisionsView';
import { CoordenadaGeo, OcorrenciaCompleta, OcorrenciaInput } from './types';
import { processarOcorrencia } from './services/analyzer';
import { fetchLiveMeteorology, reverseGeocodeMunicipio } from './services/apiConnectors';
import { renderRelatorioMarkdown } from './services/reportRenderer';
import { aplicarTema, carregarTema, salvarTema, Tema } from './services/tema';
import {
  getSavedOcorrencias,
  saveOcorrencias,
  getSavedActiveId,
  saveActiveId,
  sincronizarComServidor,
  persistirOcorrenciaServidor,
  removerOcorrenciaServidor,
  StatusPersistencia
} from './services/ocorrenciasStorage';

const COORDENADAS_PADRAO_BRASIL: CoordenadaGeo = {
  lat: -15.793889,
  lng: -47.882778
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ingestion');
  const [listaOcorrencias, setListaOcorrencias] = useState<OcorrenciaCompleta[]>(() => {
    return getSavedOcorrencias();
  });
  const [activeOcorrenciaId, setActiveOcorrenciaId] = useState<string | null>(() => {
    const savedId = getSavedActiveId();
    const savedList = getSavedOcorrencias();
    if (savedId && savedList.some(o => o.input.id === savedId)) {
      return savedId;
    }
    return savedList.length > 0 ? savedList[0].input.id : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshingMeteo, setIsRefreshingMeteo] = useState<boolean>(false);
  const [currentUtc, setCurrentUtc] = useState<string>('');

  // Estado da base pericial durável (SQLite). O operador precisa saber se o dossiê
  // está apenas neste navegador ou já gravado com registro de custódia.
  const [statusPersistencia, setStatusPersistencia] = useState<StatusPersistencia>('VERIFICANDO');

  // Tema da estação. Inicializado de forma síncrona para não haver "flash" de tema
  // claro antes do primeiro render.
  const [tema, setTema] = useState<Tema>(() => {
    const inicial = carregarTema();
    aplicarTema(inicial);
    return inicial;
  });

  const handleAlternarTema = () => {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro';
    setTema(novo);
    aplicarTema(novo);
    salvarTema(novo);
  };

  // Ocorrência em análise ativa
  const ocorrencia = useMemo<OcorrenciaCompleta | null>(() => {
    if (!activeOcorrenciaId) return null;
    return listaOcorrencias.find(o => o.input.id === activeOcorrenciaId) || null;
  }, [listaOcorrencias, activeOcorrenciaId]);

  // Relógio UTC em tempo real
  useEffect(() => {
    const updateTime = () => {
      setCurrentUtc(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reconciliar o cache local com a base pericial durável na abertura do sistema.
  // Se a base estiver indisponível, o sistema segue operando somente com o cache local
  // (trabalho de campo) e o status passa a SOMENTE_LOCAL.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const resultado = await sincronizarComServidor(getSavedOcorrencias());
      if (cancelado) return;

      setStatusPersistencia(resultado.status);
      setListaOcorrencias(resultado.ocorrencias);

      if (resultado.corrompidas.length > 0) {
        console.error(
          'ALERTA PERICIAL: registros ilegíveis na base durável:',
          resultado.corrompidas
        );
      }

      setActiveOcorrenciaId(prev =>
        prev && resultado.ocorrencias.some(o => o.input.id === prev)
          ? prev
          : resultado.ocorrencias.length > 0
            ? resultado.ocorrencias[0].input.id
            : null
      );
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  // Persistir ocorrências sempre que a lista mudar
  useEffect(() => {
    saveOcorrencias(listaOcorrencias);
  }, [listaOcorrencias]);

  // Persistir ID ativo sempre que mudar
  useEffect(() => {
    saveActiveId(activeOcorrenciaId);
  }, [activeOcorrenciaId]);

  // Selecionar uma ocorrência como ativa
  const handleSelectOcorrencia = (id: string) => {
    setActiveOcorrenciaId(id);
  };

  /**
   * Grava o dossiê na base pericial durável e atualiza o status exibido ao operador.
   * Falha de gravação não bloqueia o trabalho: o dossiê permanece no cache local e o
   * status cai para SOMENTE_LOCAL, deixando explícito que ainda não há registro de custódia.
   */
  const persistirNaBase = async (oc: OcorrenciaCompleta) => {
    const r = await persistirOcorrenciaServidor(oc);
    setStatusPersistencia(r.sucesso ? 'SINCRONIZADO' : 'SOMENTE_LOCAL');
  };

  // Excluir uma ocorrência da aplicação
  const handleDeleteOcorrencia = (id: string) => {
    const alvo = listaOcorrencias.find(o => o.input.id === id);
    const nomeAlvo = alvo ? `${alvo.input.municipio} - ${alvo.input.uf} (${alvo.input.id})` : id;

    if (!window.confirm(`Tem certeza de que deseja remover permanentemente o dossiê pericial de "${nomeAlvo}"?`)) {
      return;
    }

    const novaLista = listaOcorrencias.filter(o => o.input.id !== id);
    setListaOcorrencias(novaLista);

    // A remoção é ela própria um ato de custódia: o servidor a registra no livro append-only.
    void removerOcorrenciaServidor(id, alvo?.input.operadorId || 'OPERADOR-NAO-IDENTIFICADO');

    if (activeOcorrenciaId === id) {
      if (novaLista.length > 0) {
        setActiveOcorrenciaId(novaLista[0].input.id);
      } else {
        setActiveOcorrenciaId(null);
        setActiveTab('ingestion');
      }
    }
  };

  // Iniciar nova ocorrência em branco
  const handleNewOcorrencia = () => {
    setActiveOcorrenciaId(null);
    setActiveTab('ingestion');
  };

  // Carregar caso demonstrativo para teste (opcional pelo usuário)
  const handleLoadDemoCase = async () => {
    setIsLoading(true);
    try {
      const demoInput: OcorrenciaInput = {
        id: `SIMIA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        timestampUtc: new Date().toISOString(),
        operadorId: 'PERITO-SENASP-01',
        tipoEntrada: 'COORDENADA',
        coordenadas: {
          lat: -21.1767,
          lng: -47.8208
        },
        municipio: 'Ribeirão Preto',
        uf: 'SP',
        comarca: 'Comarca de Ribeirão Preto - TJSP',
        origemDescricao: 'Caso demonstrativo pericial: anomalia térmica em canavial no interior de São Paulo.',
        autorizacaoQueimadaStatus: 'INDISPONIVEL_VERIFICACAO_MANUAL',
        autorizacaoQueimadaDetalhe: 'CASO DEMONSTRATIVO — não utilizar em procedimento real. '
          + 'A existência de autorização de queima controlada não foi verificada: o sistema não possui '
          + 'integração com os cadastros estaduais de queima autorizada.'
      };
      const processed = await processarOcorrencia(demoInput);
      setListaOcorrencias(prev => [processed, ...prev.filter(o => o.input.id !== processed.input.id)]);
      setActiveOcorrenciaId(processed.input.id);
      await persistirNaBase(processed);
      setActiveTab('report');
    } catch (err) {
      console.error('Erro ao carregar caso teste:', err);
      alert('Não foi possível carregar o caso de teste.');
    } finally {
      setIsLoading(false);
    }
  };

  // Processar nova ocorrência a partir da Ingestão
  const handleProcessIncident = async (input: OcorrenciaInput) => {
    setIsLoading(true);
    try {
      const processed = await processarOcorrencia(input);
      setListaOcorrencias(prev => [processed, ...prev.filter(o => o.input.id !== processed.input.id)]);
      setActiveOcorrenciaId(processed.input.id);
      await persistirNaBase(processed);
      setActiveTab('report'); // Direciona ao laudo técnico gerado
    } catch (err) {
      console.error('Erro ao processar ocorrência:', err);
      alert('Falha ao processar a ocorrência. Verifique os dados inseridos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar meteorologia ao vivo via Open-Meteo
  const handleRefreshMeteo = async () => {
    if (!ocorrencia) return;
    setIsRefreshingMeteo(true);
    try {
      const liveMeteo = await fetchLiveMeteorology(ocorrencia.input.coordenadas);
      const reprocessed = await processarOcorrencia(ocorrencia.input, liveMeteo);
      setListaOcorrencias(prev =>
        prev.map(o => (o.input.id === reprocessed.input.id ? reprocessed : o))
      );
      await persistirNaBase(reprocessed);
    } catch (err) {
      console.error('Erro ao atualizar clima:', err);
    } finally {
      setIsRefreshingMeteo(false);
    }
  };

  // Exportação rápida de Markdown
  const handleQuickExport = () => {
    if (!ocorrencia) return;
    const md = renderRelatorioMarkdown(ocorrencia);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${ocorrencia.input.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ingerir foco diretamente do mapa de Satélites
  const handleSelectFocoFromSatellites = async (foco: {
    lat: number;
    lng: number;
    origem: string;
    satelite: string;
    dataHoraUtc?: string;
    municipio?: string;
    frp?: number;
  }) => {
    setIsLoading(true);
    try {
      // Município/UF/comarca resolvidos por geocodificação, não presumidos.
      // A versão anterior fixava uf: 'SP' — um foco do Pará virava ocorrência paulista,
      // o que definia a UF de consulta do INPE e a comarca competente no laudo.
      const local = await reverseGeocodeMunicipio({ lat: foco.lat, lng: foco.lng });

      const frpTexto = typeof foco.frp === 'number'
        ? ` com potência radiativa de ${foco.frp} MW`
        : '';
      const horarioTexto = foco.dataHoraUtc
        ? `Detecção registrada pela fonte em ${foco.dataHoraUtc}.`
        : 'A fonte não informou o horário da detecção — verificar diretamente no portal do órgão.';

      const input: OcorrenciaInput = {
        id: `SIMIA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        // Sem horário da fonte, o carimbo é o da ingestão — e o detalhe abaixo diz isso,
        // para que ninguém leia o timestamp da ocorrência como horário da detecção orbital.
        timestampUtc: foco.dataHoraUtc || new Date().toISOString(),
        operadorId: ocorrencia?.input.operadorId || 'PERITO-SENASP-01',
        tipoEntrada: 'ALERTA_FIRMS',
        coordenadas: { lat: foco.lat, lng: foco.lng },
        municipio: foco.municipio || local.municipio,
        uf: local.uf,
        comarca: local.comarca,
        origemDescricao: foco.origem,
        autorizacaoQueimadaStatus: 'INDISPONIVEL_VERIFICACAO_MANUAL',
        // NÃO existe integração com cadastro de queima controlada. Afirmar "sem queima
        // autorizada" seria alegar uma consulta que o sistema nunca fez.
        autorizacaoQueimadaDetalhe: `Foco orbital detectado pelo satélite ${foco.satelite}${frpTexto}. `
          + `${horarioTexto} `
          + 'A existência de autorização de queima controlada NÃO foi verificada: o sistema não possui '
          + 'integração com os cadastros estaduais. Consultar o órgão ambiental da UF antes de concluir '
          + 'pela ilicitude da conduta.'
      };

      const processed = await processarOcorrencia(input);
      setListaOcorrencias(prev => [processed, ...prev.filter(o => o.input.id !== processed.input.id)]);
      setActiveOcorrenciaId(processed.input.id);
      await persistirNaBase(processed);
      setActiveTab('report');

      if (!local.identificado) {
        alert('Foco ingerido, mas município/UF/comarca NÃO foram identificados automaticamente.\n\n'
          + 'Informe-os manualmente na aba "Nova Ocorrência": a comarca determina a competência '
          + 'jurisdicional do laudo.');
      }
    } catch (err) {
      console.error('Erro ao processar foco selecionado:', err);
      alert('Falha ao ingerir o foco selecionado. Verifique a conexão com as fontes e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCoords = ocorrencia ? ocorrencia.input.coordenadas : COORDENADAS_PADRAO_BRASIL;

  return (
    <div className="h-screen w-screen flex bg-slate-50 text-slate-800 overflow-hidden font-sans antialiased">
      {/* Menu Lateral Esquerdo */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tema={tema}
        onAlternarTema={handleAlternarTema}
        ocorrenciaId={ocorrencia?.input.id || null}
        totalOcorrencias={listaOcorrencias.length}
        operadorId={ocorrencia?.input.operadorId || 'PERITO-SENASP-01'}
        currentUtc={currentUtc}
      />

      {/* Área Central / Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior com Seletor e Gerenciador de Ocorrências */}
        <Header
          ocorrencia={ocorrencia}
          listaOcorrencias={listaOcorrencias}
          onSelectOcorrencia={handleSelectOcorrencia}
          onDeleteOcorrencia={handleDeleteOcorrencia}
          onNewOcorrencia={handleNewOcorrencia}
          onLoadDemoCase={handleLoadDemoCase}
          onRefreshMeteo={handleRefreshMeteo}
          isRefreshing={isRefreshingMeteo}
          onNavigateTab={tab => setActiveTab(tab)}
          onQuickExport={handleQuickExport}
          statusPersistencia={statusPersistencia}
        />

        {/* Visualização Ativa */}
        <main id="main-view-container" className="flex-1 overflow-y-auto bg-slate-50/50">
          {activeTab === 'ingestion' && (
            <IngestionView
              onProcessIncident={handleProcessIncident}
              isLoading={isLoading}
              currentInput={ocorrencia?.input || null}
              onLoadDemoCase={handleLoadDemoCase}
            />
          )}

          {activeTab === 'satellites' && (
            <SatellitesView
              currentCoords={currentCoords}
              onSelectFocoToIngest={handleSelectFocoFromSatellites}
            />
          )}

          {activeTab === 'map' && (
            ocorrencia ? (
              <TacticalMapView ocorrencia={ocorrencia} />
            ) : (
              <EmptyState
                titulo="Nenhum Dossiê Selecionado para o Mapa Tático"
                mensagem="Para visualizar a mancha de fogo, projeções térmicas e elementos de risco no mapa tático, selecione um dossiê no menu superior ou inicie uma nova ocorrência."
                onNavigateToIngestion={() => setActiveTab('ingestion')}
                onNavigateToSatellites={() => setActiveTab('satellites')}
                onLoadDemoCase={handleLoadDemoCase}
              />
            )
          )}

          {activeTab === 'report' && (
            ocorrencia ? (
              <ReportView ocorrencia={ocorrencia} />
            ) : (
              <EmptyState
                titulo="Nenhum Laudo Técnico Disponível"
                mensagem="O laudo pericial oficial é gerado após a ingestão das coordenadas e processamento das evidências de satélite e meteorologia."
                onNavigateToIngestion={() => setActiveTab('ingestion')}
                onNavigateToSatellites={() => setActiveTab('satellites')}
                onLoadDemoCase={handleLoadDemoCase}
              />
            )
          )}

          {activeTab === 'directives' && (
            ocorrencia ? (
              <DirectivesView ocorrencia={ocorrencia} />
            ) : (
              <EmptyState
                titulo="Nenhuma Diretriz Operacional Disponível"
                mensagem="As diretrizes de combate e tipificação penal dependem da análise do nível de risco e contexto ambiental da ocorrência."
                onNavigateToIngestion={() => setActiveTab('ingestion')}
                onNavigateToSatellites={() => setActiveTab('satellites')}
                onLoadDemoCase={handleLoadDemoCase}
              />
            )
          )}

          {activeTab === 'custody' && (
            ocorrencia ? (
              <CustodyView ocorrencia={ocorrencia} />
            ) : (
              <EmptyState
                titulo="Cadeia de Custódia Vazia"
                mensagem="A cadeia de custódia digital e hashes criptográficos SHA-256 são vinculados ao dossiê ativo em análise."
                onNavigateToIngestion={() => setActiveTab('ingestion')}
                onNavigateToSatellites={() => setActiveTab('satellites')}
                onLoadDemoCase={handleLoadDemoCase}
              />
            )
          )}

          {activeTab === 'connectors' && (
            <ApiConnectorsView currentCoords={currentCoords} />
          )}

          {activeTab === 'decisions' && <DecisionsView />}
        </main>
      </div>
    </div>
  );
}
