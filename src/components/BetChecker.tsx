'use client';

import { useState, useEffect } from 'react';
import { api, TipoLoteria, ConferirApostaResponse, LOTERIAS } from '@/lib/api';
import { LOTERIA_CONFIG } from '@/lib/loterias';
import logger from '@/lib/logger';
import { NumberBall } from './NumberBall';
import { Search, Loader2, Trophy, Target, BarChart3 } from 'lucide-react';

interface BetCheckerProps {
  tipo: TipoLoteria;
}

export function BetChecker({ tipo }: BetCheckerProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConferirApostaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limits = LOTERIA_CONFIG[tipo];
  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);

  useEffect(() => {
    setSelectedNumbers([]);
    setResult(null);
    setError(null);
  }, [tipo]);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < limits.max) {
      const newNumbers = [...selectedNumbers, num];
      // Super Sete: column order matters, don't sort
      if (tipo !== 'super_sete') newNumbers.sort((a, b) => a - b);
      setSelectedNumbers(newNumbers);
    }
  };

  const handleCheck = async () => {
    if (selectedNumbers.length < limits.min) {
      setError(`Selecione pelo menos ${limits.min} números`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.conferirAposta(tipo, selectedNumbers);
      setResult(data);
    } catch (err) {
      setError('Erro ao conferir aposta');
      logger.error({ err }, 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Search className="w-6 h-6" style={{ color: loteriaInfo?.color }} />
          Conferir Aposta - {loteriaInfo?.label}
        </h2>

        <p className="text-text-tertiary mb-4">
          Selecione de {limits.min} a {limits.max} números para verificar no histórico
        </p>

        {/* Number Grid */}
        <div className="grid grid-cols-10 gap-2 mb-6">
          {Array.from({ length: limits.numeroFinal - limits.numeroInicial + 1 }, (_, i) => limits.numeroInicial + i).map((num) => (
            <button
              key={num}
              onClick={() => toggleNumber(num)}
              aria-pressed={selectedNumbers.includes(num)}
              className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                selectedNumbers.includes(num)
                  ? 'text-text-primary scale-110 shadow-lg'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
              style={
                selectedNumbers.includes(num) ? { backgroundColor: loteriaInfo?.color } : {}
              }
            >
              {num.toString().padStart(2, '0')}
            </button>
          ))}
        </div>

        {/* Selected Numbers */}
        {selectedNumbers.length > 0 && (
          <div className="bg-surface-secondary/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-tertiary text-sm">
                Selecionados: {selectedNumbers.length}/{limits.max}
              </span>
              <button
                onClick={clearSelection}
                className="text-red-400 text-sm hover:text-red-300"
              >
                Limpar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedNumbers.map((num) => (
                <NumberBall key={num} number={num} size="sm" variant="selected" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 text-red-400 rounded-lg p-3 mb-4">{error}</div>
        )}

        <button
          onClick={handleCheck}
          disabled={loading || selectedNumbers.length < limits.min}
          className="w-full py-3 rounded-lg font-bold text-text-primary transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: loteriaInfo?.color }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Conferir no Histórico
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: loteriaInfo?.color }} />
              Resumo da Conferência
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-text-primary">{result.resumo.totalConcursosAnalisados}</p>
                <p className="text-text-tertiary text-sm">Concursos Analisados</p>
              </div>
              <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{result.resumo.vezesPremiado}</p>
                <p className="text-text-tertiary text-sm">Vezes Premiado</p>
              </div>
              <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{result.resumo.percentualPremiado.toFixed(1)}%</p>
                <p className="text-text-tertiary text-sm">Taxa de Acerto</p>
              </div>
              <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{result.resumo.maiorAcertos}</p>
                <p className="text-text-tertiary text-sm">Maior Acertos</p>
              </div>
              <div className="bg-surface-secondary/50 rounded-lg p-4 text-center col-span-2 md:col-span-1">
                <p className="text-xl font-bold text-blue-400">#{result.resumo.concursoMaiorAcertos}</p>
                <p className="text-text-tertiary text-sm">Concurso Maior Acertos</p>
              </div>
            </div>
          </div>

          {/* Prize History */}
          {result.concursosPremiados.length > 0 && (
            <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Concursos Premiados
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {result.concursosPremiados.map((c) => (
                  <div key={`${c.numeroConcurso}-${c.faixa}`} className="bg-surface-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-primary font-bold">Concurso #{c.numeroConcurso}</span>
                      <span className="text-green-400 font-bold">{c.faixa}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {c.dezenasSorteadas.map((num) => (
                        <NumberBall
                          key={num}
                          number={num}
                          size="sm"
                          variant={c.acertos.includes(num) ? 'selected' : 'default'}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-tertiary">
                      <Target className="w-4 h-4" />
                      Acertos: {c.acertos.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
