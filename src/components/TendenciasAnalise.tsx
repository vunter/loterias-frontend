'use client';

import { useState, useEffect } from 'react';
import { api, TipoLoteria, TendenciaResponse, NumeroTendencia, PadraoVencedor, LOTERIAS } from '@/lib/api';
import logger from '@/lib/logger';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { nivoTheme, CHART_COLORS } from '@/lib/chartTheme';
import { TrendingUp, TrendingDown, Zap, Target, AlertCircle, BarChart3, Loader2 } from 'lucide-react';

interface TendenciasAnaliseProps {
  loteria: TipoLoteria;
}

export default function TendenciasAnalise({ loteria }: TendenciasAnaliseProps) {
  const [data, setData] = useState<TendenciaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loteriaInfo = LOTERIAS.find(l => l.value === loteria);
  const cor = loteriaInfo?.color || '#666';

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTendencias(loteria);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError('Erro ao carregar análise de tendências');
          logger.error({ err }, 'Failed to load tendencias analysis');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [loteria]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
        <span className="ml-3 text-text-tertiary">Carregando análise de tendências...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center gap-2">
        <AlertCircle className="text-red-400" size={20} />
        <span className="text-red-300">{error || 'Dados não disponíveis'}</span>
      </div>
    );
  }

  const chartDataQuentes = data.tendenciasQuentes.map(t => ({
    numero: t.numero.toString().padStart(2, '0'),
    frequencia: t.frequenciaTotal,
    crescimento: t.taxaCrescimento,
    atraso: t.atrasoAtual
  }));

  const chartDataFrios = data.tendenciasFrias.map(t => ({
    numero: t.numero.toString().padStart(2, '0'),
    frequencia: t.frequenciaTotal,
    crescimento: t.taxaCrescimento,
    atraso: t.atrasoAtual
  }));

  const padroesPie = data.padroesVencedores.slice(0, 8).map((p, i) => ({
    id: p.padrao,
    name: p.descricao.length > 20 ? p.descricao.slice(0, 20) + '...' : p.descricao,
    value: p.percentual,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-xl" style={{ borderTop: `4px solid ${cor}` }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={24} style={{ color: cor }} />
          <h2 className="text-xl font-bold text-text-primary">Análise de Tendências</h2>
          <span className="text-text-tertiary text-sm ml-auto">
            {data.totalConcursosAnalisados} concursos analisados
          </span>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {Object.entries(data.mediasHistoricas).map(([key, value]) => (
            <div key={key} className="bg-surface-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: cor }}>{value}</div>
              <div className="text-xs text-text-tertiary">{formatMetricName(key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Números Quentes */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-green-400" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">Números em Alta (Quentes)</h3>
        </div>
        
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
          {data.tendenciasQuentes.map(t => (
            <TendenciaCard key={t.numero} tendencia={t} tipo="quente" />
          ))}
        </div>

        {chartDataQuentes.length > 0 && (
          <div className="h-64 mt-4">
            <ResponsiveBar
              data={chartDataQuentes}
              keys={['frequencia', 'crescimento']}
              indexBy="numero"
              groupMode="grouped"
              margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
              padding={0.2}
              borderRadius={3}
              colors={['#22c55e', '#f59e0b']}
              axisBottom={{ tickSize: 0, tickPadding: 8 }}
              axisLeft={{ tickSize: 0, tickPadding: 8 }}
              enableLabel={false}
              legends={[{
                dataFrom: 'keys', anchor: 'top-right', direction: 'row',
                translateY: -10, itemWidth: 120, itemHeight: 16,
                itemTextColor: 'var(--color-text-tertiary)', symbolSize: 10, symbolShape: 'circle',
              }]}
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
        )}
      </div>

      {/* Números Emergentes */}
      {data.tendenciasEmergentes.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-yellow-400" size={20} />
            <h3 className="text-lg font-semibold text-text-primary">Números Emergentes</h3>
            <span className="text-sm text-text-tertiary ml-auto">Crescimento recente acima da média</span>
          </div>
          
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {data.tendenciasEmergentes.map(t => (
              <TendenciaCard key={t.numero} tendencia={t} tipo="emergente" />
            ))}
          </div>
        </div>
      )}

      {/* Números Frios */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">Números em Baixa (Frios)</h3>
        </div>
        
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
          {data.tendenciasFrias.map(t => (
            <TendenciaCard key={t.numero} tendencia={t} tipo="frio" />
          ))}
        </div>

        {chartDataFrios.length > 0 && (
          <div className="h-64 mt-4">
            <ResponsiveBar
              data={chartDataFrios}
              keys={['frequencia', 'atraso']}
              indexBy="numero"
              groupMode="grouped"
              margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
              padding={0.2}
              borderRadius={3}
              colors={['#3b82f6', '#ef4444']}
              axisBottom={{ tickSize: 0, tickPadding: 8 }}
              axisLeft={{ tickSize: 0, tickPadding: 8 }}
              enableLabel={false}
              legends={[{
                dataFrom: 'keys', anchor: 'top-right', direction: 'row',
                translateY: -10, itemWidth: 140, itemHeight: 16,
                itemTextColor: 'var(--color-text-tertiary)', symbolSize: 10, symbolShape: 'circle',
              }]}
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
        )}
      </div>

      {/* Padrões Vencedores */}
      {data.padroesVencedores.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-purple-400" size={20} />
            <h3 className="text-lg font-semibold text-text-primary">Padrões em Concursos com Ganhadores</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsivePie
                data={padroesPie.map(d => ({ id: d.id, label: d.name, value: d.value, color: d.color }))}
                colors={{ datum: 'data.color' }}
                margin={{ top: 30, right: 100, bottom: 30, left: 100 }}
                innerRadius={0.4}
                padAngle={1}
                cornerRadius={4}
                activeOuterRadiusOffset={6}
                arcLinkLabelsSkipAngle={8}
                arcLinkLabelsTextColor="var(--color-text-secondary)"
                arcLinkLabelsThickness={1.5}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLinkLabelsDiagonalLength={16}
                arcLinkLabelsStraightLength={20}
                arcLabelsSkipAngle={20}
                arcLabelsTextColor="#fff"
                enableArcLabels={true}
                arcLabel={(d) => `${((d.arc.endAngle - d.arc.startAngle) / (2 * Math.PI) * 100).toFixed(0)}%`}
                theme={nivoTheme}
                motionConfig="gentle"
              />
            </div>

            <div className="space-y-2">
              {data.padroesVencedores.slice(0, 8).map((p, i) => (
                <div key={p.padrao} className="flex items-center gap-2 text-sm bg-surface-secondary/50 rounded-lg p-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="flex-1 text-text-secondary">{p.descricao}</span>
                  <span className="font-medium text-text-primary">{p.percentual.toFixed(1)}%</span>
                  <span className="text-text-muted">({p.ocorrencias}x)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TendenciaCard({ tendencia, tipo }: { tendencia: NumeroTendencia; tipo: 'quente' | 'frio' | 'emergente' }) {
  const bgColor = tipo === 'quente' ? 'bg-green-600' : tipo === 'frio' ? 'bg-blue-600' : 'bg-yellow-500';
  const borderColor = tipo === 'quente' ? 'border-green-700' : tipo === 'frio' ? 'border-blue-700' : 'border-yellow-600';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-2 text-center`}>
      <div className="text-lg font-bold text-white">
        {tendencia.numero.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-white/80">
        {tendencia.taxaCrescimento > 0 ? '+' : ''}{tendencia.taxaCrescimento.toFixed(0)}%
      </div>
      <div className="text-xs text-white/60">
        atraso: {tendencia.atrasoAtual}
      </div>
    </div>
  );
}

function formatMetricName(key: string): string {
  const names: Record<string, string> = {
    somaMedia: 'Soma Média',
    paresMedia: 'Média Pares',
    imparesMedia: 'Média Ímpares',
    baixosMedia: 'Média Baixos',
    altosMedia: 'Média Altos'
  };
  return names[key] || key;
}
