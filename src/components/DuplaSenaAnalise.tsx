'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api, DuplaSenaAnalise as DuplaSenaData } from '@/lib/api';
import { formatDate, formatCurrencyCompact } from '@/lib/formatters';
import logger from '@/lib/logger';
import { NumberBall } from './NumberBall';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { nivoTheme, CHART_COLORS } from '@/lib/chartTheme';
import { Loader2, Layers, GitCompare, TrendingUp, Calendar } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: DuplaSenaData;
  timestamp: number;
}

export function DuplaSenaAnalise() {
  const [data, setData] = useState<DuplaSenaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<CacheEntry | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION_MS) {
      setData(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getDuplaSena();
      setData(response);
      // Update cache
      cacheRef.current = { data: response, timestamp: Date.now() };
    } catch (err) {
      setError('Erro ao carregar análise da Dupla Sena.');
      logger.error({ err }, 'Failed to load dupla sena analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData();
    return () => controller.abort();
  }, [loadData]);

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
        <p>{error || 'Dados não disponíveis'}</p>
      </div>
    );
  }

  if (data.totalConcursosAnalisados === 0) {
    return (
      <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-400 rounded-xl p-4">
        <p>Nenhum concurso com dados do segundo sorteio disponível.</p>
      </div>
    );
  }

  const coincidenciasData = Object.entries(data.coincidencias.distribuicaoCoincidencias)
    .map(([coinc, freq]) => ({
      name: `${coinc} coincidência${parseInt(coinc) !== 1 ? 's' : ''}`,
      value: freq,
      coinc: parseInt(coinc),
    }))
    .sort((a, b) => a.coinc - b.coinc);

  // Ensure tiny slices have a minimum visible size
  const total = coincidenciasData.reduce((s, d) => s + d.value, 0);
  const minPct = 0.02; // 2% minimum for visibility
  const nivoData = coincidenciasData.map((d, i) => ({
    id: d.name,
    label: d.name,
    value: Math.max(d.value, total * minPct),
    realValue: d.value,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-6 h-6 text-red-400" />
              Análise Dupla Sena
            </h2>
            <p className="text-text-tertiary mt-1">Comparação entre 1º e 2º sorteio</p>
          </div>
          <div className="text-right">
            <p className="text-text-tertiary text-sm">Concursos Analisados</p>
            <p className="text-2xl font-bold text-text-primary">{data.totalConcursosAnalisados}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas de Correlação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl p-4">
          <p className="text-text-tertiary text-sm">Correlação</p>
          <p className="text-2xl font-bold text-text-primary">{(data.comparacao.correlacao * 100).toFixed(1)}%</p>
          <p className="text-text-muted text-xs">entre os sorteios</p>
        </div>
        <div className="bg-surface-primary rounded-xl p-4">
          <p className="text-text-tertiary text-sm">Média Coincidências</p>
          <p className="text-2xl font-bold text-yellow-400">{data.coincidencias.mediaCoincidencias.toFixed(1)}</p>
          <p className="text-text-muted text-xs">números iguais por concurso</p>
        </div>
        <div className="bg-surface-primary rounded-xl p-4">
          <p className="text-text-tertiary text-sm">Máx. Coincidências</p>
          <p className="text-2xl font-bold text-green-400">{data.coincidencias.maxCoincidencias}</p>
          <p className="text-text-muted text-xs">já registradas</p>
        </div>
        <div className="bg-surface-primary rounded-xl p-4">
          <p className="text-text-tertiary text-sm">Mín. Coincidências</p>
          <p className="text-2xl font-bold text-blue-400">{data.coincidencias.minCoincidencias}</p>
          <p className="text-text-muted text-xs">já registradas</p>
        </div>
      </div>

      {/* Números Quentes - Comparação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Quentes 1º Sorteio
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.numerosQuentesPrimeiroSorteio.map((n, i) => (
              <NumberBall key={i} number={n} size="sm" variant="hot" />
            ))}
          </div>
        </div>

        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Quentes 2º Sorteio
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.numerosQuentesSegundoSorteio.map((n, i) => (
              <NumberBall key={i} number={n} size="sm" variant="cold" />
            ))}
          </div>
        </div>

        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-purple-400" />
            Quentes em Ambos
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.numerosQuentesAmbos.length > 0 ? (
              data.numerosQuentesAmbos.map((n, i) => (
                <NumberBall key={i} number={n} size="sm" />
              ))
            ) : (
              <p className="text-text-muted text-sm">Nenhum número em comum</p>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Coincidências */}
      <div className="bg-surface-primary rounded-xl p-5">
        <h4 className="text-text-primary font-semibold mb-4">Distribuição de Coincidências</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveBar
              data={coincidenciasData.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))}
              keys={['value']}
              indexBy="name"
              margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
              padding={0.3}
              borderRadius={4}
              colors={({ data }) => (data as unknown as Record<string, string>).color || '#f59e0b'}
              axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: -20 }}
              axisLeft={{ tickSize: 0, tickPadding: 8 }}
              enableLabel={true}
              labelSkipHeight={16}
              labelTextColor="#fff"
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
          <div className="h-96">
            <ResponsivePie
              data={nivoData}
              colors={{ datum: 'data.color' }}
              margin={{ top: 40, right: 140, bottom: 40, left: 140 }}
              innerRadius={0.45}
              padAngle={1}
              cornerRadius={4}
              activeOuterRadiusOffset={6}
              arcLinkLabelsSkipAngle={0}
              arcLinkLabelsTextColor="var(--color-text-secondary)"
              arcLinkLabelsThickness={1.5}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLinkLabelsDiagonalLength={20}
              arcLinkLabelsStraightLength={24}
              arcLinkLabelsTextOffset={4}
              arcLabelsSkipAngle={0}
              arcLabelsTextColor="#fff"
              enableArcLabels={true}
              arcLabel={(d) => {
                const real = (d.data as unknown as { realValue: number }).realValue;
                const pct = total > 0 ? (real / total * 100) : 0;
                return pct < 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(0)}%`;
              }}
              tooltip={({ datum }) => {
                const real = (datum.data as unknown as { realValue: number }).realValue;
                return (
                  <div style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-primary)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--color-text-primary)' }}>
                    <strong>{datum.label}</strong>: {real} ({(real / total * 100).toFixed(1)}%)
                  </div>
                );
              }}
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
        </div>
      </div>

      {/* Últimos Concursos */}
      <div className="bg-surface-primary rounded-xl p-5">
        <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-text-tertiary" />
          Últimos Concursos
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-text-tertiary py-2 px-2">#</th>
                <th className="text-left text-text-tertiary py-2 px-2">Data</th>
                <th className="text-left text-text-tertiary py-2 px-2">1º Sorteio</th>
                <th className="text-left text-text-tertiary py-2 px-2">2º Sorteio</th>
                <th className="text-center text-text-tertiary py-2 px-2">Coinc.</th>
                <th className="text-right text-text-tertiary py-2 px-2">Prêmio</th>
              </tr>
            </thead>
            <tbody>
              {data.ultimosConcursos.slice(0, 10).map((c) => (
                <tr key={c.numero} className="border-b border-border-primary/50 hover:bg-surface-secondary/30">
                  <td className="py-2 px-2 text-text-primary font-medium">{c.numero}</td>
                  <td className="py-2 px-2 text-text-tertiary">{formatDate(c.data)}</td>
                  <td className="py-2 px-2">
                    <div className="flex gap-1">
                      {c.dezenasPrimeiroSorteio.map((n) => (
                        <span key={n} className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-1">
                      {c.dezenasSegundoSorteio.map((n) => (
                        <span key={n} className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.coincidencias >= 3 ? 'bg-yellow-900/50 text-yellow-400' :
                      c.coincidencias >= 1 ? 'bg-surface-secondary text-text-secondary' :
                      'bg-surface-primary text-text-muted'
                    }`}>
                      {c.coincidencias}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-green-400">{formatCurrencyCompact(c.premioFaixaUm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
