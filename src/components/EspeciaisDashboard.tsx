'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, ConcursosEspeciaisResponse, LoteriaEspecialInfo, ProximoConcursoEspecialInfo } from '@/lib/api';
import { formatCurrencyCompact, formatDate } from '@/lib/formatters';
import logger from '@/lib/logger';
import { Timer, Sparkles, TrendingUp, Loader2, Calendar } from 'lucide-react';

export function EspeciaisDashboard() {
  const [data, setData] = useState<ConcursosEspeciaisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  const loteriasComEspecial = useMemo(() => data?.loteriasComEspecial.filter(
    (l) => l.valorAcumuladoConcursoEspecial || l.valorAcumuladoConcurso05
  ) ?? [], [data?.loteriasComEspecial]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getEspeciais();
        if (!cancelled) setData(response);
      } catch (err) {
        if (!cancelled) {
          setError('Erro ao carregar dados dos concursos especiais.');
          logger.error({ err }, 'Failed to load especiais data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [retryCount]);

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
        <button onClick={() => setRetryCount(c => c + 1)} className="mt-2 text-sm underline hover:no-underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Total Acumulado */}
      <div className="bg-gradient-to-r from-yellow-900/50 to-amber-800/30 rounded-xl p-6 shadow-xl border border-yellow-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Concursos Especiais
            </h2>
            <p className="text-text-tertiary mt-1">Mega da Virada, Quina de São João e outros</p>
          </div>
          <div className="text-right">
            <p className="text-text-tertiary text-sm">Total Acumulado Especiais</p>
            <p className="text-3xl font-bold text-yellow-400">
              {formatCurrencyCompact(data.totalAcumuladoEspeciais)}
            </p>
          </div>
        </div>
      </div>

      {/* Próximos Concursos Especiais */}
      {data.proximosConcursosEspeciais.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" />
            Próximos Concursos Especiais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.proximosConcursosEspeciais.map((especial) => (
              <ProximoEspecialCard key={especial.tipoLoteria} especial={especial} />
            ))}
          </div>
        </div>
      )}

      {/* Cards de Loterias com Acumulado Especial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loteriasComEspecial.map((loteria) => (
          <LoteriaEspecialCard key={loteria.tipo} loteria={loteria} />
        ))}
      </div>

      {/* Grid de todas as loterias - Resumo Compacto */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Resumo de Todas as Loterias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.loteriasComEspecial.map((loteria) => (
            <LoteriaResumoCard key={loteria.tipo} loteria={loteria} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProximoEspecialCard({ especial }: { especial: ProximoConcursoEspecialInfo }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Refresh once per hour to keep "days until" accurate
    const id = setInterval(() => setNow(Date.now()), 3_600_000);
    return () => clearInterval(id);
  }, []);

  const diasAte = useMemo(() => especial.dataEstimada 
    ? Math.ceil((new Date(especial.dataEstimada).getTime() - now) / (1000 * 60 * 60 * 24))
    : null, [especial.dataEstimada, now]);

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg p-4 border border-purple-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-primary font-bold">{especial.nomeLoteria}</span>
        {diasAte !== null && diasAte > 0 && (
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
            {diasAte} dias
          </span>
        )}
      </div>
      <p className="text-purple-300 text-sm mb-2">{especial.nomeEspecial || 'Especial'}</p>
      <div className="flex items-center justify-between">
        <div>
          {especial.dataEstimada && (
            <>
              <p className="text-text-tertiary text-xs">Data Prevista</p>
              <p className="text-text-primary font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-400" />
                {formatDate(especial.dataEstimada)}
              </p>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-text-tertiary text-xs">Acumulado</p>
          <p className="text-yellow-400 font-bold">{formatCurrencyCompact(especial.valorAcumulado)}</p>
        </div>
      </div>
      {especial.concursosFaltando > 0 && (
        <p className="text-text-muted text-xs mt-2">
          ~{especial.concursosFaltando} concursos restantes
        </p>
      )}
    </div>
  );
}

function LoteriaEspecialCard({ loteria }: { loteria: LoteriaEspecialInfo }) {
  const valorAcumulado = loteria.valorAcumuladoConcursoEspecial || loteria.valorAcumuladoConcurso05 || 0;

  return (
    <div 
      className="bg-surface-primary rounded-xl p-5 shadow-lg" 
      style={{ borderLeft: `4px solid ${loteria.cor}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-lg font-bold text-text-primary">{loteria.nome}</h4>
          {loteria.nomeEspecial && (
            <span 
              className="text-xs px-2 py-0.5 rounded-full" 
              style={{ backgroundColor: `${loteria.cor}40`, color: loteria.cor }}
            >
              {loteria.nomeEspecial}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-text-tertiary text-xs">Acumulado Especial</p>
          <p className="text-yellow-400 font-bold text-lg">{formatCurrencyCompact(valorAcumulado)}</p>
        </div>
      </div>

      {/* Info do concurso regular atual (apenas referência) */}
      <div className="border-t border-border-primary pt-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-text-muted text-xs">Último concurso regular</p>
            <p className="text-text-secondary font-medium">
              #{loteria.ultimoConcurso.numero} — {formatDate(loteria.ultimoConcurso.data)}
            </p>
          </div>
          {loteria.ultimoConcurso.valorEstimadoProximo ? (
            <div className="text-right">
              <p className="text-text-muted text-xs">Próximo estimado</p>
              <p className="text-green-400 font-medium">
                {formatCurrencyCompact(loteria.ultimoConcurso.valorEstimadoProximo)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoteriaResumoCard({ loteria }: { loteria: LoteriaEspecialInfo }) {
  const temEspecial = !!(loteria.valorAcumuladoConcursoEspecial || loteria.valorAcumuladoConcurso05);
  return (
    <div 
      className="bg-surface-secondary/50 rounded-lg p-3 hover:bg-surface-secondary transition-colors"
      style={{ borderLeft: `3px solid ${loteria.cor}` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-primary font-medium">{loteria.nome}</p>
          {loteria.nomeEspecial && (
            <p className="text-text-muted text-xs">{loteria.nomeEspecial}</p>
          )}
        </div>
        <div className="text-right">
          {temEspecial ? (
            <>
              <p className="text-text-muted text-xs">Acumulado Especial</p>
              <p className="text-yellow-400 font-medium text-sm">
                {formatCurrencyCompact(loteria.valorAcumuladoConcursoEspecial || loteria.valorAcumuladoConcurso05 || 0)}
              </p>
            </>
          ) : (
            <p className="text-text-muted text-xs">Sem especial ativo</p>
          )}
        </div>
      </div>
    </div>
  );
}
