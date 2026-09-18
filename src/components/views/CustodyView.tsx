import React, { useState } from 'react';
import {
  Hash,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  FileCheck2,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';
import { OcorrenciaCompleta } from '../../types';
import { calculateSha256, verifyCustodyIntegrity } from '../../services/crypto';

interface CustodyViewProps {
  ocorrencia: OcorrenciaCompleta;
}

export const CustodyView: React.FC<CustodyViewProps> = ({ ocorrencia }) => {
  const { custodia } = ocorrencia;

  // Estado do Testador / Validador Independente
  const [testCanonical, setTestCanonical] = useState<string>(custodia.canonicalString);
  const [testClaimedHash, setTestClaimedHash] = useState<string>(custodia.sha256Hex);
  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    computedHash: string;
    claimedHash: string;
    diffMessage?: string;
  } | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Executar teste de verificação
  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyCustodyIntegrity(testCanonical, testClaimedHash);
      setValidationResult({
        tested: true,
        ...res
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Carregar dados da ocorrência ativa atual
  const handleLoadCurrent = () => {
    setTestCanonical(custodia.canonicalString);
    setTestClaimedHash(custodia.sha256Hex);
    setValidationResult(null);
  };

  /**
   * Injeta adulteração para demonstrar a detecção.
   *
   * A versão anterior procurava o literal 'STATUS=Ativo', que nem sempre existe no
   * payload canônico — quando não existia, a simulação virava no-op silencioso e o
   * validador respondia "100% ÍNTEGRO" logo após o operador pedir uma adulteração,
   * ensinando exatamente o contrário do que a ferramenta deve demonstrar.
   *
   * Agora a adulteração incide na última casa decimal da latitude: sutil, do tipo que
   * um adversário tentaria, e que o hash tem obrigação de detectar.
   */
  const handleSimulateTamper = () => {
    setTestCanonical(prev => {
      const m = /LAT=(-?\d+\.\d{5})(\d)/.exec(prev);
      if (m) {
        const digito = m[2];
        const adulterado = digito === '9' ? '8' : String(Number(digito) + 1);
        return prev.replace(`LAT=${m[1]}${digito}`, `LAT=${m[1]}${adulterado}`);
      }
      // Garantia de que a simulação NUNCA seja um no-op silencioso.
      return `${prev} [CONTEUDO_ADULTERADO]`;
    });
    setValidationResult(null);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(custodia.sha256Hex);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-sky-600" />
            Cadeia de Custódia Digital & Auditoria Criptográfica SHA-256
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Garantia da higidez probatória da evidência geoespacial em conformidade com o Art. 158-A do CPP (Lei Anticrime).
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Hash Real Calculado (FIPS 180-4)</span>
        </div>
      </div>

      {/* Cartão de Registro Ativo da Ocorrência */}
      <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-2">
            <Hash className="w-4 h-4 text-sky-600" />
            Assinatura Digital da Ocorrência Ativa ({ocorrencia.input.id})
          </span>
          <button
            type="button"
            onClick={handleCopyHash}
            className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-medium"
          >
            {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedHash ? 'Hash copiado' : 'Copiar Hash'}</span>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] mb-1 font-medium">
              Payload Canônico Determinístico:
            </span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-700 break-all select-all">
              {custodia.canonicalString}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Campos canônicos: VERSAO | STAMP_UTC | GEO_REF | CADASTRO_CAR | HISTORICO_SIGAMGEO | DATA_SOURCES | OPERATOR_ID
            </p>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1 font-medium">
              Resumo Criptográfico SHA-256 (64 hexadecimais):
            </span>
            <div className="p-3.5 bg-slate-900 text-emerald-400 rounded-lg border border-slate-800 font-mono text-sm font-bold tracking-wider break-all select-all">
              {custodia.sha256Hex}
            </div>
          </div>
        </div>
      </div>

      {/* Módulo de Verificação Forense Independente */}
      <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-sky-600" />
              Verificador Independente de Integridade Forense
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Insira ou altere qualquer dado abaixo para testar se a assinatura criptográfica se mantém íntegra.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadCurrent}
              className="text-xs text-sky-700 hover:text-sky-900 px-2.5 py-1 rounded bg-sky-50 border border-sky-200 transition-colors"
            >
              Restaurar Ocorrência Atual
            </button>
            <button
              type="button"
              onClick={handleSimulateTamper}
              className="text-xs text-rose-700 hover:text-rose-900 px-2.5 py-1 rounded bg-rose-50 border border-rose-200 transition-colors"
              title="Simula uma adulteração no texto para testar a detecção de fraude"
            >
              Simular Adulteração
            </button>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Texto Canônico da Evidência:
            </label>
            <textarea
              rows={3}
              value={testCanonical}
              onChange={e => {
                setTestCanonical(e.target.value);
                setValidationResult(null);
              }}
              className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Hash Alegado (para confronto):
            </label>
            <input
              type="text"
              value={testClaimedHash}
              onChange={e => {
                setTestClaimedHash(e.target.value);
                setValidationResult(null);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Calculando Hash...' : 'Verificar Autenticidade'}</span>
            </button>
          </div>

          {/* Resultado da Auditoria */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                validationResult.isValid
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {validationResult.isValid ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>INTEGRIDADE PROBATÓRIA CONFIRMADA (100% ÍNTEGRO)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>ALERTA DE DIVERGÊNCIA FORENSE: POSSÍVEL FRAUDE / ADULTERAÇÃO</span>
                  </>
                )}
              </div>

              <p className="text-[11px] leading-relaxed">
                {validationResult.diffMessage}
              </p>

              <div className="pt-2 border-t border-current/20 font-mono text-[11px] space-y-1">
                <div>
                  <span className="opacity-70">Hash Computado no Vôo:</span>{' '}
                  <span className="font-bold">{validationResult.computedHash}</span>
                </div>
                <div>
                  <span className="opacity-70">Hash Alegado no Registro:</span>{' '}
                  <span className="font-bold">{validationResult.claimedHash}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
