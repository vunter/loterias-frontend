'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, TipoLoteria, TimeCoracaoMesSorteResponse, LOTERIAS } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import logger from '@/lib/logger';
import { Heart, Calendar, Loader2, TrendingUp, TrendingDown, Clock, Trophy, BarChart2 } from 'lucide-react';

interface TimeCoracaoRankingProps {
  tipo: TipoLoteria;
}

export function TimeCoracaoRanking({ tipo }: TimeCoracaoRankingProps) {
  const [data, setData] = useState<TimeCoracaoMesSorteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'frequencia' | 'atraso' | 'nome'>('frequencia');

  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
  const isTimemania = tipo === 'timemania';
  const isDiaDeSorte = tipo === 'dia_de_sorte';

  useEffect(() => {
    if (!isTimemania && !isDiaDeSorte) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getTimeCoracao(tipo)
      .then(data => { if (!cancelled) setData(data); })
      .catch((err) => {
        if (!cancelled) {
          setError('Erro ao carregar dados');
          logger.error({ err }, 'Failed to load time coracao data');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tipo, isTimemania, isDiaDeSorte]);

  if (!isTimemania && !isDiaDeSorte) {
    return (
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <div className="text-center text-text-tertiary py-8">
          <p>Esta análise está disponível apenas para:</p>
          <p className="font-bold text-text-primary mt-2">Timemania (Time do Coração) e Dia de Sorte (Mês da Sorte)</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-400 rounded-xl p-4">
        <p className="font-medium">Erro</p>
        <p className="text-sm">{error || 'Dados não disponíveis'}</p>
      </div>
    );
  }

  const sortedItems = [...data.frequenciaCompleta].sort((a, b) => {
    switch (sortBy) {
      case 'atraso':
        return b.atrasoAtual - a.atrasoAtual;
      case 'nome':
        return a.nome.localeCompare(b.nome);
      default:
        return b.frequencia - a.frequencia;
    }
  });

  const Icon = isTimemania ? Heart : Calendar;
  const title = isTimemania ? 'Time do Coração' : 'Mês da Sorte';
  const itemLabel = isTimemania ? 'Time' : 'Mês';

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg" style={{ borderTop: `4px solid ${loteriaInfo?.color}` }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Icon className="w-6 h-6" style={{ color: loteriaInfo?.color }} />
            Ranking de {title} - {loteriaInfo?.label}
          </h2>
          <span className="text-text-tertiary text-sm">
            {data.totalConcursosAnalisados} concursos analisados
          </span>
        </div>

        {/* Último Sorteio */}
        {data.ultimoSorteio && (
          <div className="bg-surface-secondary/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-text-tertiary">Último Sorteio (#{data.ultimoSorteio.numeroConcurso})</span>
              </div>
              <span className="text-text-muted">{formatDate(data.ultimoSorteio.data)}</span>
            </div>
            <p className="text-text-primary font-bold text-xl mt-2">{data.ultimoSorteio.timeOuMes}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {data.maisFrequente && (
            <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-4 border border-red-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-red-400" />
                <span className="text-text-tertiary text-sm">Mais Frequente</span>
              </div>
              <p className="text-text-primary font-bold text-lg truncate" title={data.maisFrequente.nome}>
                {data.maisFrequente.nome}
              </p>
              <p className="text-red-400 text-sm">
                {data.maisFrequente.frequencia}x ({data.maisFrequente.percentual}%)
              </p>
            </div>
          )}
          
          {data.menosFrequente && (
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-4 border border-blue-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-blue-400" />
                <span className="text-text-tertiary text-sm">Menos Frequente</span>
              </div>
              <p className="text-text-primary font-bold text-lg truncate" title={data.menosFrequente.nome}>
                {data.menosFrequente.nome}
              </p>
              <p className="text-blue-400 text-sm">
                {data.menosFrequente.frequencia}x ({data.menosFrequente.percentual}%)
              </p>
            </div>
          )}
          
          {sortedItems.length > 0 && (
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-4 border border-purple-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-text-tertiary text-sm">Mais Atrasado</span>
              </div>
              <MaisAtrasadoCard frequenciaCompleta={data.frequenciaCompleta} />
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSortBy('frequencia')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
              sortBy === 'frequencia' ? 'bg-blue-600 text-text-primary' : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Frequência
          </button>
          <button
            onClick={() => setSortBy('atraso')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
              sortBy === 'atraso' ? 'bg-blue-600 text-text-primary' : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
            }`}
          >
            <Clock className="w-4 h-4" />
            Atraso
          </button>
          <button
            onClick={() => setSortBy('nome')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'nome' ? 'bg-blue-600 text-text-primary' : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
            }`}
          >
            A-Z
          </button>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">#</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">{itemLabel}</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Frequência</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">%</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Atraso Atual</th>
                <th className="text-left py-3 px-2 text-text-tertiary text-sm">Última Aparição</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, i) => (
                <tr key={item.nome} className="border-b border-border-primary/50 hover:bg-surface-secondary/30">
                  <td className="py-3 px-2 text-text-muted">{i + 1}</td>
                  <td className="py-3 px-2">
                    <span className="text-text-primary font-medium">{item.nome}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-bold">{item.frequencia}</span>
                      <div 
                        className="h-2 rounded-full bg-surface-secondary" 
                        style={{ width: '60px' }}
                      >
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${(item.frequencia / (data.maisFrequente?.frequencia || 1)) * 100}%`,
                            backgroundColor: loteriaInfo?.color 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-text-secondary">{item.percentual.toFixed(1)}%</td>
                  <td className="py-3 px-2">
                    <span className={`font-medium ${
                      item.atrasoAtual > 20 ? 'text-purple-400' : 
                      item.atrasoAtual > 10 ? 'text-yellow-400' : 'text-text-secondary'
                    }`}>
                      {item.atrasoAtual}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-text-tertiary text-sm">{formatDate(item.ultimaAparicao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MaisAtrasadoCard({ frequenciaCompleta }: { frequenciaCompleta: { nome: string; atrasoAtual: number }[] }) {
  const maisAtrasado = useMemo(
    () => [...frequenciaCompleta].sort((a, b) => b.atrasoAtual - a.atrasoAtual)[0],
    [frequenciaCompleta]
  );
  return (
    <>
      <p className="text-text-primary font-bold text-lg truncate" title={maisAtrasado?.nome}>
        {maisAtrasado?.nome}
      </p>
      <p className="text-purple-400 text-sm">
        {maisAtrasado?.atrasoAtual} sorteios sem sair
      </p>
    </>
  );
}
