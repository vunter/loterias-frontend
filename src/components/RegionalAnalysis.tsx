'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, TipoLoteria, LOTERIAS } from '@/lib/api';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/lib/formatters';
import logger from '@/lib/logger';
import { Loader2, TrendingUp, MapPin, Users, Trophy, Info } from 'lucide-react';

interface AcumuladoResponse {
  tipoLoteria: string;
  nomeLoteria: string;
  acumulado: boolean;
  valorAcumulado: number;
  valorEstimadoProximo: number;
  concursosAcumulados: number;
  ultimoConcurso: number;
  dataUltimoConcurso: string | null;
  dataEstimadaProximo: string | null;
}

interface GanhadoresUFResponse {
  tipoLoteria: string;
  nomeLoteria: string;
  totalConcursosAnalisados: number;
  totalGanhadores: number;
  cidadesDisponiveisDesde: string | null;
  porEstado: EstadoGanhadores[];
}

interface EstadoGanhadores {
  uf: string;
  totalGanhadores: number;
  totalConcursos: number;
  cidades: CidadeGanhadores[];
}

interface CidadeGanhadores {
  cidade: string;
  totalGanhadores: number;
}

const UF_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

interface RegionalAnalysisProps {
  tipo: TipoLoteria;
}

export function RegionalAnalysis({ tipo }: RegionalAnalysisProps) {
  const [data, setData] = useState<GanhadoresUFResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUF, setExpandedUF] = useState<string | null>(null);
  const [showCityHint, setShowCityHint] = useState<string | null>(null);

  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
  const color = loteriaInfo?.color || '#666';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpandedUF(null);

    api.getGanhadoresPorUF(tipo)
      .then((json) => {
        if (!cancelled) setData(json as GanhadoresUFResponse);
      })
      .catch(err => {
        if (!cancelled) {
          setError('Erro ao carregar dados regionais.');
          logger.error({ err }, 'Failed to load regional data');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tipo]);

  const maxGanhadores = useMemo(() => {
    if (!data?.porEstado.length) return 1;
    return data.porEstado[0].totalGanhadores;
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
        <p>{error || 'Sem dados disponíveis.'}</p>
      </div>
    );
  }

  if (!data.porEstado.length) {
    return (
      <div className="bg-surface-primary rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-tertiary">Nenhum dado de ganhadores por estado disponível para esta loteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg" style={{ borderTop: `4px solid ${color}` }}>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5" style={{ color }} />
          Ganhadores por Estado
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Total de Ganhadores</p>
            <p className="text-text-primary font-bold text-xl">{data.totalGanhadores.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Estados com Ganhadores</p>
            <p className="text-text-primary font-bold text-xl">{data.porEstado.length}</p>
          </div>
          <div className="bg-surface-secondary/50 rounded-lg p-3">
            <p className="text-text-tertiary text-sm">Concursos Analisados</p>
            <p className="text-text-primary font-bold text-xl">{data.totalConcursosAnalisados.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Ranking por Estado (Faixa Principal)
        </h3>
        <div className="space-y-2">
          {data.porEstado.map((estado, idx) => {
            const pct = (estado.totalGanhadores / maxGanhadores) * 100;
            const isExpanded = expandedUF === estado.uf;

            return (
              <div key={estado.uf}>
                <button
                  onClick={() => setExpandedUF(isExpanded ? null : estado.uf)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-tertiary text-sm font-mono w-5 text-right">{idx + 1}.</span>
                    <span className="text-text-primary font-bold w-8">{estado.uf}</span>
                    <div className="flex-1 relative">
                      <div className="h-7 bg-surface-secondary rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500 flex items-center px-2"
                          style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: `${color}cc` }}
                        >
                          {pct > 15 && (
                            <span className="text-white text-xs font-bold truncate">
                              {estado.totalGanhadores.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {pct <= 15 && (
                      <span className="text-text-secondary text-sm font-bold min-w-[4rem] text-right">
                        {estado.totalGanhadores.toLocaleString('pt-BR')}
                      </span>
                    )}
                    <span className="text-text-muted text-xs min-w-[3rem] text-right">
                      {estado.totalConcursos} cx
                    </span>
                  </div>
                </button>

                {/* Expanded cities */}
                {isExpanded && estado.cidades.length > 0 && (
                  <div className="ml-16 mt-1 mb-2 pl-3 border-l-2 border-border-primary">
                    <p className="text-text-muted text-xs mb-1 font-medium">
                      {UF_NAMES[estado.uf] || estado.uf} — Top cidades:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {estado.cidades.map(c => {
                        const isUnknownCity = c.cidade === 'Não informada';
                        const hintKey = `${estado.uf}-hint`;
                        const isHintVisible = showCityHint === hintKey;
                        return (
                          <div key={`${estado.uf}-${c.cidade || '__empty'}`} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className={`flex items-center gap-1 ${isUnknownCity ? 'text-text-muted italic' : 'text-text-secondary'}`}>
                                {isUnknownCity ? 'Não informada' : c.cidade}
                                {isUnknownCity && data.cidadesDisponiveisDesde && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowCityHint(isHintVisible ? null : hintKey); }}
                                    title={`Concursos anteriores a ${formatDate(data.cidadesDisponiveisDesde)} não informavam a cidade do ganhador`}
                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface-secondary hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-colors cursor-help shrink-0"
                                    aria-label="Mais informações"
                                  >
                                    <Info className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                              <span className="text-text-primary font-bold ml-2 whitespace-nowrap">{c.totalGanhadores.toLocaleString('pt-BR')}</span>
                            </div>
                            {isUnknownCity && isHintVisible && data.cidadesDisponiveisDesde && (
                              <p className="text-text-muted text-xs mt-1 ml-1 bg-surface-secondary/70 rounded px-2 py-1">
                                Concursos anteriores a {formatDate(data.cidadesDisponiveisDesde)} não informavam a cidade do ganhador.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
