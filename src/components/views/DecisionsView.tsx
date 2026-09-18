import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquareCode,
  CheckCircle2,
  AlertCircle,
  Send,
  Database,
  Satellite,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export const DecisionsView: React.FC = () => {
  const [decisoes, setDecisoes] = useState({
    brasilMais: 'oficio',
    persistencia: 'offline',
    muralhaPaulista: 'diretriz',
    carFonte: 'sp'
  });

  const [comentario, setComentario] = useState('');
  const [salvo, setSalvo] = useState(false);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-600" />
            Alinhamento de Decisões Relevantes do Projeto
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conforme a diretriz de não tomar decisões estratégicas de forma autônoma, consulte e defina as diretrizes fundamentais da arquitetura.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
          <MessageSquareCode className="w-4 h-4 text-sky-600" />
          <span>Controle de Governança com o Usuário</span>
        </div>
      </div>

      <form onSubmit={handleSalvar} className="space-y-5">
        {/* Decisão 1: Brasil M.A.I.S */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <Satellite className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Integração com Imagens PlanetScope 3m do Programa Brasil M.A.I.S (MJSP)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O acesso à API direta do Brasil M.A.I.S requer credenciamento formal do órgão policial/pericial perante a SENASP e o Ministério da Justiça. Como você prefere estruturar essa conexão no sistema?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                decisoes.brasilMais === 'oficio'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="brasilMais"
                checked={decisoes.brasilMais === 'oficio'}
                onChange={() => setDecisoes({ ...decisoes, brasilMais: 'oficio' })}
                className="hidden"
              />
              <span className="font-semibold block mb-0.5">Opção A (Padrão Recomendado): Instrução Pericial Formal</span>
              <span className="text-[11px] text-slate-500 block">
                O laudo indica a janela temporal e as coordenadas exatas da passagem orbital, orientando a requisição formal via portal oficial do MJSP sem expor credenciais no código.
              </span>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                decisoes.brasilMais === 'api'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="brasilMais"
                checked={decisoes.brasilMais === 'api'}
                onChange={() => setDecisoes({ ...decisoes, brasilMais: 'api' })}
                className="hidden"
              />
              <span className="font-semibold block mb-0.5">Opção B: Conector de API Institucional com Token</span>
              <span className="text-[11px] text-slate-500 block">
                Configurar endpoint autenticado no backend Express via variável de ambiente secreta para download programático do mosaico PlanetScope.
              </span>
            </label>
          </div>
        </div>

        {/* Decisão 2: Persistência de Dados */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Modelo de Armazenamento e Persistência das Ocorrências
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Para fins de auditoria e segurança da informação, como as investigações e laudos devem ser persistidos?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                decisoes.persistencia === 'offline'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="persistencia"
                checked={decisoes.persistencia === 'offline'}
                onChange={() => setDecisoes({ ...decisoes, persistencia: 'offline' })}
                className="hidden"
              />
              <span className="font-semibold block mb-0.5">Opção A: Offline-First e Arquivos Assinados</span>
              <span className="text-[11px] text-slate-500 block">
                Os relatórios são exportados diretamente em .md, .json e .geojson com SHA-256 no dispositivo do perito/investigador, sem vazamento de dados em nuvem pública.
              </span>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                decisoes.persistencia === 'nuvem'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="persistencia"
                checked={decisoes.persistencia === 'nuvem'}
                onChange={() => setDecisoes({ ...decisoes, persistencia: 'nuvem' })}
                className="hidden"
              />
              <span className="font-semibold block mb-0.5">Opção B: Banco Centralizado Seguro</span>
              <span className="text-[11px] text-slate-500 block">
                Provisionar banco de dados criptografado na nuvem (Firestore ou PostgreSQL) com autenticação de agentes da polícia e histórico compartilhado.
              </span>
            </label>
          </div>
        </div>

        {/* Decisão 3: Muralha Paulista / LPR */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Alertas do Sistema Muralha Paulista / Detecta (LPR de Placas)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Qual o nível de acionamento desejado para o rastreamento veicular nas estradas vicinais no entorno do foco?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                decisoes.muralhaPaulista === 'diretriz'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="muralhaPaulista"
                checked={decisoes.muralhaPaulista === 'diretriz'}
                onChange={() => setDecisoes({ ...decisoes, muralhaPaulista: 'diretriz' })}
                className="hidden"
              />
              <span className="font-semibold block mb-0.5">Diretriz Tática no Laudo (Padrão)</span>
              <span className="text-[11px] text-slate-500 block">
                O relatório emite a orientação padronizada para que a equipe de inteligência policial consulte o Detecta/SINESP no raio de 10 km das últimas 4 horas.
              </span>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                decisoes.muralhaPaulista === 'webhook'
                  ? 'border-sky-500 bg-sky-50/60 text-sky-900 font-medium'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="muralhaPaulista"
                checked={decisoes.muralhaPaulista === 'webhook'}
                onChange={() => setDecisoes({ ...decisoes, muralhaPaulista: 'webhook' })}
                className="hidden"
              />
              <span className="font-semibold block mb-0.5">Conector Automático de Radar LPR</span>
              <span className="text-[11px] text-slate-500 block">
                Criar rota no servidor para receber payloads em tempo real de radares inteligentes do DER/Polícia Rodoviária.
              </span>
            </label>
          </div>
        </div>

        {/* Campo de Orientação Livre do Usuário */}
        <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-xs space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Comentários Adicionais ou Diretrizes Específicas do Usuário:
          </label>
          <textarea
            rows={3}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Digite aqui instruções sobre preferências, APIs adicionais, comarcas específicas ou requisitos institucionais..."
            className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
          ></textarea>
        </div>

        <div className="flex items-center justify-between pt-2">
          {salvo && (
            <div className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Diretrizes e escolhas registradas com sucesso!</span>
            </div>
          )}
          <button
            type="submit"
            className="ml-auto flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Salvar Diretrizes de Projeto</span>
          </button>
        </div>
      </form>
    </div>
  );
};
