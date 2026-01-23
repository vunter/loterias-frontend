'use client';

import { useState, useEffect } from 'react';
import { api, TipoLoteria, OrdemSorteioAnalise as OrdemSorteioData, LOTERIAS } from '@/lib/api';
import logger from '@/lib/logger';
import { NumberBall } from './NumberBall';
import { ResponsiveBar } from '@nivo/bar';
import { nivoTheme } from '@/lib/chartTheme';
import { ArrowDown, ArrowUp, Loader2, Hash } from 'lucide-react';

interface Props {
  tipo: TipoLoteria;
}

export function OrdemSorteioAnalise({ tipo }: Props) {
  const [data, setData] = useState<OrdemSorteioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getOrdemSorteio(tipo);
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) {
          setError('Erro ao carregar análise de ordem de sorteio.');
          logger.error({ err }, 'Failed to load ordem sorteio analysis');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [tipo]);

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
        <p>Nenhum concurso com dados de ordem de sorteio disponível.</p>
        <p className="text-sm mt-1">Sincronize os concursos para obter esses dados.</p>
      </div>
    );
  }

  const primeiraBola = data.primeiraBola.map(n => ({
    numero: n.numero,
    frequencia: n.frequencia,
    percentual: n.percentual,
  }));

  const ultimaBola = data.ultimaBola.map(n => ({
    numero: n.numero,
    frequencia: n.frequencia,
    percentual: n.percentual,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-primary rounded-xl p-4" style={{ borderTop: `4px solid ${loteriaInfo?.color}` }}>
        <h3 className="text-lg font-bold text-text-primary">Análise de Ordem de Sorteio</h3>
        <p className="text-text-tertiary text-sm">{data.totalConcursosAnalisados} concursos analisados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primeira Bola */}
        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-green-400" />
            Primeira Bola (mais frequentes)
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.primeiraBola.slice(0, 5).map((n, i) => (
              <div key={i} className="text-center">
                <NumberBall number={n.numero} size="md" variant="hot" />
                <p className="text-xs text-text-tertiary mt-1">{n.percentual}%</p>
              </div>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveBar
              data={primeiraBola.map((d, i) => ({ ...d, numero: String(d.numero), color: i < 3 ? '#22c55e' : '#4ade80' }))}
              keys={['frequencia']}
              indexBy="numero"
              layout="horizontal"
              margin={{ top: 5, right: 20, bottom: 5, left: 30 }}
              padding={0.25}
              borderRadius={4}
              colors={({ data }) => (data as Record<string, unknown>).color as string}
              axisBottom={null}
              axisLeft={{ tickSize: 0, tickPadding: 8 }}
              enableLabel={true}
              labelTextColor="#fff"
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
        </div>

        {/* Última Bola */}
        <div className="bg-surface-primary rounded-xl p-5">
          <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-blue-400" />
            Última Bola (mais frequentes)
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.ultimaBola.slice(0, 5).map((n, i) => (
              <div key={i} className="text-center">
                <NumberBall number={n.numero} size="md" variant="cold" />
                <p className="text-xs text-text-tertiary mt-1">{n.percentual}%</p>
              </div>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveBar
              data={ultimaBola.map((d, i) => ({ ...d, numero: String(d.numero), color: i < 3 ? '#3b82f6' : '#60a5fa' }))}
              keys={['frequencia']}
              indexBy="numero"
              layout="horizontal"
              margin={{ top: 5, right: 20, bottom: 5, left: 30 }}
              padding={0.25}
              borderRadius={4}
              colors={({ data }) => (data as Record<string, unknown>).color as string}
              axisBottom={null}
              axisLeft={{ tickSize: 0, tickPadding: 8 }}
              enableLabel={true}
              labelTextColor="#fff"
              theme={nivoTheme}
              motionConfig="gentle"
            />
          </div>
        </div>
      </div>

      {/* Posição Média */}
      <div className="bg-surface-primary rounded-xl p-5">
        <h4 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-400" />
          Números que saem mais cedo (menor posição média)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {data.mediaOrdem.slice(0, 10).map((n, i) => (
            <div key={i} className="bg-surface-secondary/50 rounded-lg p-3 text-center">
              <NumberBall number={n.numero} size="sm" />
              <p className="text-text-primary font-medium mt-2">{n.percentual.toFixed(1)}ª</p>
              <p className="text-text-muted text-xs">posição média</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
