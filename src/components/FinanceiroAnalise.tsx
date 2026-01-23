'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api, TipoLoteria, FinanceiroAnalise as FinanceiroData, LOTERIAS } from '@/lib/api';
import { formatCurrencyShort, formatCurrencyCompact, formatCurrency, formatDate } from '@/lib/formatters';
import logger from '@/lib/logger';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { nivoTheme } from '@/lib/chartTheme';
import { DollarSign, TrendingUp, PiggyBank, Loader2, Trophy, Percent, Calendar, Table2, Award, Users } from 'lucide-react';

type Period = '6M' | '1A' | '2A' | '5A' | 'MAX';
const PERIODS: { key: Period; label: string; months: number }[] = [
  { key: '6M', label: '6 Meses', months: 6 },
  { key: '1A', label: '1 Ano', months: 12 },
  { key: '2A', label: '2 Anos', months: 24 },
  { key: '5A', label: '5 Anos', months: 60 },
  { key: 'MAX', label: 'Máximo', months: 0 },
];

/** Formats a raw BRL value to a compact axis label: 1.500 → "1,5K", 53.000.000 → "53M", 3.000.000.000 → "3,0B" */
function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

/** Formats a raw BRL value to a readable tooltip string: R$ 3,05 bi, R$ 53,2 mi, R$ 1.500 */
function formatTooltipValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(2).replace('.', ',')} bi`;
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} mil`;
  return `R$ ${value.toFixed(0)}`;
}

interface Props {
  tipo: TipoLoteria;
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 bg-surface-secondary/50 rounded-lg p-1">
      <Calendar className="w-4 h-4 text-text-tertiary ml-2 mr-1 shrink-0" />
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            value === p.key
              ? 'bg-blue-600 text-white'
              : 'text-text-tertiary hover:text-text-primary hover:bg-surface-secondary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}


export function FinanceiroAnalise({ tipo }: Props) {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('2A');
  const cacheRef = useRef<Map<string, FinanceiroData>>(new Map());

  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);

  // Reset cache when lottery type changes
  useEffect(() => {
    cacheRef.current.clear();
  }, [tipo]);

  const getDateRange = useCallback((p: Period): { dataInicio?: string; dataFim?: string } => {
    const periodDef = PERIODS.find(pd => pd.key === p);
    if (!periodDef || periodDef.months === 0) return {};
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - periodDef.months, 1);
    return {
      dataInicio: start.toISOString().slice(0, 10),
      dataFim: now.toISOString().slice(0, 10),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const { dataInicio, dataFim } = getDateRange(period);
      const cacheKey = `${tipo}-${dataInicio ?? 'all'}-${dataFim ?? 'all'}`;

      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.getFinanceiro(tipo, dataInicio, dataFim);
        if (!cancelled) {
          cacheRef.current.set(cacheKey, response);
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Erro ao carregar análise financeira.');
          logger.error({ err }, 'Failed to load financeiro analysis');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [tipo, period, getDateRange]);

  const evolucaoData = useMemo(() => {
    if (!data) return [];
    return data.evolucaoMensal.map(m => ({
      ...m,
    }));
  }, [data]);

  const jackpotData = useMemo(() => {
    if (!data) return [];
    return [...data.ultimosConcursos].reverse().map(c => ({
      ...c,
      label: `#${c.numero}`,
      temGanhador: c.ganhadores > 0,
    }));
  }, [data]);

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

  return (
    <div className="space-y-6">
      {/* Resumo Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl p-4" style={{ borderTop: `4px solid ${loteriaInfo?.color}` }}>
          <div className="flex items-center gap-2 text-text-tertiary text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total Arrecadado
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrencyShort(data.resumo.totalArrecadado)}</p>
        </div>

        <div className="bg-surface-primary rounded-xl p-4" style={{ borderTop: '4px solid #22c55e' }}>
          <div className="flex items-center gap-2 text-text-tertiary text-sm mb-1">
            <Trophy className="w-4 h-4" />
            Prêmios Pagos
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrencyShort(data.resumo.totalPremiosPagos)}</p>
        </div>

        <div className="bg-surface-primary rounded-xl p-4" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="flex items-center gap-2 text-text-tertiary text-sm mb-1">
            <Percent className="w-4 h-4" />
            Retorno (ROI)
          </div>
          <p className="text-xl font-bold text-yellow-400">{data.resumo.percentualRetornoPremios.toFixed(1)}%</p>
        </div>

        <div className="bg-surface-primary rounded-xl p-4" style={{ borderTop: '4px solid #8b5cf6' }}>
          <div className="flex items-center gap-2 text-text-tertiary text-sm mb-1">
            <PiggyBank className="w-4 h-4" />
            Reserva
          </div>
          <p className="text-xl font-bold text-purple-400">{formatCurrencyShort(data.resumo.saldoReservaAtual)}</p>
        </div>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="bg-surface-primary rounded-xl p-5">
        <h4 className="text-text-primary font-semibold mb-4">Estatísticas por Concurso</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Recorde de Arrecadação</p>
            <p className="text-text-primary font-bold">{formatCurrencyCompact(data.resumo.maiorArrecadacao)}</p>
            <p className="text-text-muted text-xs">Concurso #{data.resumo.concursoMaiorArrecadacao} (sorteio único)</p>
          </div>
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Média Arrecadação/Sorteio</p>
            <p className="text-text-primary font-bold">{formatCurrencyCompact(data.resumo.mediaArrecadacao)}</p>
            <p className="text-text-muted text-xs">por concurso individual</p>
          </div>
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Média Prêmio Faixa 1</p>
            <p className="text-green-400 font-bold">{formatCurrencyCompact(data.resumo.mediaPremioFaixaUm)}</p>
            <p className="text-text-muted text-xs">prêmio principal por sorteio</p>
          </div>
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Total de Concursos</p>
            <p className="text-text-primary font-bold">{data.ultimosConcursos.length > 0 ? data.ultimosConcursos[0].numero.toLocaleString('pt-BR') : '-'}</p>
            <p className="text-text-muted text-xs">sorteios realizados</p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h4 className="text-text-primary font-semibold text-sm">Período dos gráficos</h4>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Gráfico de Evolução com Concursos/Mês */}
      <div className="bg-surface-primary rounded-xl p-5">
        <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Evolução Mensal — Arrecadação vs Prêmios
        </h4>
        <div className="h-72">
          <ResponsiveLine
            data={[
              {
                id: 'Arrecadado',
                data: evolucaoData.map(d => ({ x: d.mesAno, y: d.totalArrecadado })),
              },
              {
                id: 'Prêmios',
                data: evolucaoData.map(d => ({ x: d.mesAno, y: d.totalPremios })),
              },
            ]}
            margin={{ top: 20, right: 20, bottom: 60, left: 70 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            axisBottom={{ tickRotation: -45, tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 8, format: formatAxisValue }}
            colors={['#3b82f6', '#22c55e']}
            enableArea={true}
            areaOpacity={0.15}
            lineWidth={2}
            pointSize={0}
            enableSlices="x"
            sliceTooltip={({ slice }) => (
              <div style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-primary)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{slice.points[0]?.data.xFormatted}</strong>
                {slice.points.map(p => (
                  <div key={p.id} style={{ color: p.seriesColor, marginTop: 4 }}>
                    {p.seriesId}: {formatTooltipValue(Number(p.data.yFormatted))}
                  </div>
                ))}
              </div>
            )}
            legends={[{
              anchor: 'top-left', direction: 'row', translateY: -20,
              itemWidth: 100, itemHeight: 16, itemTextColor: 'var(--color-text-tertiary)',
              symbolSize: 10, symbolShape: 'circle',
            }]}
            theme={nivoTheme}
            motionConfig="gentle"
          />
        </div>
        <p className="text-text-muted text-xs mt-2">Valores representam o total mensal (soma de todos os sorteios do mês).</p>
      </div>
      <div className="bg-surface-primary rounded-xl p-5">
        <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5 text-yellow-400" />
          ROI Mensal (% retorno aos apostadores)
        </h4>
        <div className="h-52">
          <ResponsiveBar
            data={evolucaoData.map(d => ({ ...d, color: d.roi > 100 ? '#ef4444' : '#f59e0b' }))}
            keys={['roi']}
            indexBy="mesAno"
            margin={{ top: 10, right: 20, bottom: 60, left: 50 }}
            padding={0.2}
            borderRadius={4}
            colors={({ data }) => (data as Record<string, unknown>).color as string}
            axisBottom={{ tickRotation: -45, tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 8, format: (v) => `${v}%` }}
            enableLabel={false}
            tooltip={({ data: d }) => (
              <div style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-primary)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--color-text-primary)' }}>
                ROI: {Number((d as Record<string, unknown>).roi).toFixed(1)}%
              </div>
            )}
            layers={['grid', 'axes', 'bars', 'markers', 'legends', 'annotations',
              ({ bars, yScale }) => {
                const avgY = (yScale as (v: number) => number)(data.resumo.percentualRetornoPremios);
                if (bars.length === 0) return null;
                const x1 = bars[0].x;
                const x2 = bars[bars.length - 1].x + bars[bars.length - 1].width;
                return (
                  <line x1={x1} x2={x2} y1={avgY} y2={avgY} stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" />
                );
              },
            ]}
            theme={nivoTheme}
            motionConfig="gentle"
          />
        </div>
        <p className="text-text-muted text-xs mt-2">Barras vermelhas indicam meses com ROI &gt; 100% (acúmulo pago). Linha tracejada = média geral.</p>
      </div>

      {/* Evolução do Prêmio Principal */}
      {jackpotData.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-400" />
            Evolução do Prêmio Principal (últimos {jackpotData.length} concursos)
          </h4>
          <div className="h-64">
            <ResponsiveLine
              data={[
                {
                  id: 'Prêmio Faixa 1',
                  data: jackpotData.map(d => ({ x: d.label, y: d.premioFaixaUm })),
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 60, left: 70 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              axisBottom={{
                tickRotation: -45, tickSize: 0, tickPadding: 8,
                tickValues: jackpotData.filter((_, i) => i % Math.max(1, Math.floor(jackpotData.length / 12)) === 0).map(d => d.label),
              }}
              axisLeft={{ tickSize: 0, tickPadding: 8, format: formatAxisValue }}
              colors={['#22c55e']}
              enableArea={true}
              areaOpacity={0.2}
              lineWidth={2}
              pointSize={0}
              enableSlices="x"
              sliceTooltip={({ slice }) => {
                const point = slice.points[0];
                const idx = jackpotData.findIndex(d => d.label === point?.data.xFormatted);
                const ganhadores = idx >= 0 ? jackpotData[idx].ganhadores : 0;
                return (
                  <div style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-primary)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Concurso {point?.data.xFormatted}</strong>
                    <div style={{ color: '#22c55e', marginTop: 4 }}>Prêmio: {formatTooltipValue(Number(point?.data.yFormatted))}</div>
                    <div style={{ color: '#f59e0b', marginTop: 2 }}>Ganhadores: {ganhadores}</div>
                  </div>
                );
              }}
              layers={['grid', 'markers', 'axes', 'areas', 'lines', 'slices', 'mesh', 'legends',
                ({ innerWidth, innerHeight, xScale, data: lineData }) => {
                  // Draw winner markers as circles at the top
                  return (
                    <g>
                      {jackpotData.map((d, i) => {
                        if (d.ganhadores === 0) return null;
                        const x = (xScale as unknown as (v: string) => number)(d.label);
                        return (
                          <circle key={i} cx={x} cy={5} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
                        );
                      })}
                    </g>
                  );
                },
              ]}
              legends={[{
                anchor: 'top-left', direction: 'row', translateY: -20,
                itemWidth: 120, itemHeight: 16, itemTextColor: 'var(--color-text-tertiary)',
                symbolSize: 10, symbolShape: 'circle',
              }]}
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
          <p className="text-text-muted text-xs mt-2">Quando o prêmio sobe sem ganhadores, está acumulando. Pontos amarelos no topo indicam concursos com ganhadores na faixa principal.</p>
        </div>
      )}

      {/* Últimos Concursos Table */}
      {data.ultimosConcursos.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <Table2 className="w-5 h-5 text-indigo-400" />
            Últimos Concursos
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left text-text-tertiary font-medium py-2 px-3">#</th>
                  <th className="text-left text-text-tertiary font-medium py-2 px-3">Data</th>
                  <th className="text-right text-text-tertiary font-medium py-2 px-3">Arrecadação</th>
                  <th className="text-right text-text-tertiary font-medium py-2 px-3">Prêmio Faixa 1</th>
                  <th className="text-right text-text-tertiary font-medium py-2 px-3">Estimado Próx.</th>
                  <th className="text-center text-text-tertiary font-medium py-2 px-3">
                    <span className="flex items-center justify-center gap-1"><Users className="w-3.5 h-3.5" /> Ganh.</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.ultimosConcursos.slice(0, 20).map(c => (
                  <tr key={c.numero} className="border-b border-border-primary/50 hover:bg-surface-secondary/30 transition-colors">
                    <td className="py-2 px-3 text-text-primary font-medium">{c.numero}</td>
                    <td className="py-2 px-3 text-text-secondary">{formatDate(c.data)}</td>
                    <td className="py-2 px-3 text-right text-text-secondary">{c.arrecadado ? formatCurrencyCompact(c.arrecadado) : '-'}</td>
                    <td className="py-2 px-3 text-right text-green-400 font-medium">{c.premioFaixaUm ? formatCurrency(c.premioFaixaUm) : '-'}</td>
                    <td className="py-2 px-3 text-right text-blue-400">{c.estimadoProximo ? formatCurrencyCompact(c.estimadoProximo) : '-'}</td>
                    <td className="py-2 px-3 text-center">
                      {c.ganhadores > 0 ? (
                        <span className="inline-flex items-center gap-1 text-yellow-400 font-bold">
                          <Trophy className="w-3.5 h-3.5" /> {c.ganhadores}
                        </span>
                      ) : (
                        <span className="text-text-muted">Acumulou</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
