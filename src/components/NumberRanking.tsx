'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, TipoLoteria, AnaliseNumeroResponse, LOTERIAS } from '@/lib/api';
import logger from '@/lib/logger';
import { NumberBall } from './NumberBall';
import { BarChart2, Loader2, TrendingUp, Clock, Thermometer } from 'lucide-react';

interface NumberRankingProps {
  tipo: TipoLoteria;
}

export function NumberRanking({ tipo }: NumberRankingProps) {
  const [ranking, setRanking] = useState<AnaliseNumeroResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'frequencia' | 'atraso'>('score');

  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getRankingNumeros(tipo)
      .then(data => { if (!cancelled) setRanking(data); })
      .catch(err => { if (!cancelled) logger.error({ err }, 'Failed to load number ranking'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tipo]);

  const sortedRanking = useMemo(() => [...ranking].sort((a, b) => {
    switch (sortBy) {
      case 'frequencia':
        return b.estatisticas.frequencia - a.estatisticas.frequencia;
      case 'atraso':
        return b.estatisticas.atrasoAtual - a.estatisticas.atrasoAtual;
      default:
        return b.tendencia.scoreTendencia - a.tendencia.scoreTendencia;
    }
  }), [ranking, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUENTE': return 'text-red-400 bg-red-900/30';
      case 'FRIO': return 'text-blue-400 bg-blue-900/30';
      case 'ATRASADO': return 'text-purple-400 bg-purple-900/30';
      case 'RECENTE': return 'text-green-400 bg-green-900/30';
      default: return 'text-text-tertiary bg-surface-secondary/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-blue-400';
    return 'text-text-tertiary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart2 className="w-6 h-6" style={{ color: loteriaInfo?.color }} />
            Ranking de Números - {loteriaInfo?.label}
          </h2>

          {/* Sort Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('score')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'score' ? 'bg-blue-600 text-white' : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Score
            </button>
            <button
              onClick={() => setSortBy('frequencia')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'frequencia' ? 'bg-blue-600 text-white' : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
              }`}
            >
              <Thermometer className="w-4 h-4 inline mr-1" />
              Frequência
            </button>
            <button
              onClick={() => setSortBy('atraso')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'atraso' ? 'bg-blue-600 text-white' : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Atraso
            </button>
          </div>
        </div>

        {/* Top 10 Highlight */}
        <div className="mb-6">
          <h3 className="text-text-tertiary text-sm mb-3">Top 10 por {sortBy === 'score' ? 'Score de Tendência' : sortBy === 'frequencia' ? 'Frequência' : 'Atraso'}</h3>
          <div className="flex flex-wrap gap-3">
            {[...sortedRanking.slice(0, 10)].sort((a, b) => a.numero - b.numero).map((item) => (
              <div key={item.numero} className="relative">
                <NumberBall
                  number={item.numero}
                  size="lg"
                  variant={item.tendencia.status === 'QUENTE' ? 'hot' : item.tendencia.status === 'ATRASADO' ? 'late' : item.tendencia.status === 'FRIO' ? 'cold' : 'default'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">#</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Número</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Frequência</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">% Aparições</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Atraso</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Média Atraso</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Status</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Score</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Companheiros</th>
              </tr>
            </thead>
            <tbody>
              {sortedRanking.map((item, i) => (
                <tr key={item.numero} className="border-b border-border-primary/50 hover:bg-surface-secondary/30">
                  <td className="py-3 px-2 text-text-muted">{i + 1}</td>
                  <td className="py-3 px-2">
                    <NumberBall number={item.numero} size="sm" />
                  </td>
                  <td className="py-3 px-2 text-text-primary font-medium">{item.estatisticas.frequencia}</td>
                  <td className="py-3 px-2 text-text-secondary">{item.estatisticas.percentualAparicoes.toFixed(1)}%</td>
                  <td className="py-3 px-2 text-text-primary">{item.estatisticas.atrasoAtual}</td>
                  <td className="py-3 px-2 text-text-secondary">{item.estatisticas.mediaAtraso.toFixed(1)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.tendencia.status)}`}>
                      {item.tendencia.status}
                    </span>
                  </td>
                  <td className={`py-3 px-2 font-bold ${getScoreColor(item.tendencia.scoreTendencia)}`}>
                    {item.tendencia.scoreTendencia}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      {item.numerosCompanheiros?.slice(0, 5).map((c) => (
                        <span key={c} className="text-text-on-inverted text-xs bg-surface-inverted px-1.5 py-0.5 rounded">
                          {c.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
