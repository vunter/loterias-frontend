'use client';

import { useMemo } from 'react';
import { DashboardResponse, LOTERIAS, TipoLoteria } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { NumberBall } from './NumberBall';
import { TrendingUp, TrendingDown, Clock, Trophy, Calendar, DollarSign, Users, Heart, Flame } from 'lucide-react';

interface DashboardProps {
  data: DashboardResponse;
  tipo: TipoLoteria;
}

export function Dashboard({ data, tipo }: DashboardProps) {
  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
  const color = loteriaInfo?.color || '#666';

  const sortedQuentes = useMemo(() => [...data.numerosQuentes].sort((a, b) => a - b), [data.numerosQuentes]);
  const sortedFrios = useMemo(() => [...data.numerosFrios].sort((a, b) => a - b), [data.numerosFrios]);
  const sortedAtrasados = useMemo(() => [...data.numerosAtrasados].sort((a, b) => a - b), [data.numerosAtrasados]);

  // Jackpot alert derived from existing dashboard data
  const isAccumulated = data.ultimoConcurso?.acumulou ?? false;
  const accumulatedValue = data.ultimoConcurso?.valorAcumulado ?? 0;
  const consecutiveAccumulations = data.ultimoConcursoComGanhador?.concursosDesdeUltimoGanhador ?? 0;

  return (
    <div className="space-y-6">
      {/* Jackpot Alert Banner */}
      {isAccumulated && accumulatedValue > 0 && (
        <div 
          className="relative overflow-hidden rounded-xl p-6 shadow-xl animate-pulse-slow"
          style={{ 
            background: `linear-gradient(135deg, ${color}40, ${color}20, ${color}40)`,
            border: `2px solid ${color}80` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-500/10 to-yellow-500/5" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Flame className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                  <Flame className="w-4 h-4 inline-block" /> ACUMULOU!
                  {consecutiveAccumulations > 1 && (
                    <span className="text-sm font-normal text-yellow-300/80">
                      ({consecutiveAccumulations}x consecutivos)
                    </span>
                  )}
                </h2>
                <p className="text-text-secondary text-sm">
                  Ninguém acertou — prêmio acumulado para o próximo concurso
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-text-muted text-xs uppercase tracking-wider">Prêmio Estimado</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-yellow-400 tracking-tight">
                {formatCurrency(accumulatedValue)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Contest */}
      {data.ultimoConcurso && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-xl" style={{ borderTop: `4px solid ${color}` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color }} />
              Último Concurso #{data.ultimoConcurso.numero}
            </h2>
            <span className="text-text-tertiary flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(data.ultimoConcurso.data)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {data.ultimoConcurso.dezenas?.map((num, idx) => (
              <NumberBall key={`${num}-${idx}`} number={num} size="lg" />
            ))}
          </div>

          {/* Second draw for Dupla Sena */}
          {data.ultimoConcurso.dezenasSegundoSorteio && data.ultimoConcurso.dezenasSegundoSorteio.length > 0 && (
            <div className="mb-4">
              <p className="text-text-tertiary text-sm mb-2">2º Sorteio</p>
              <div className="flex flex-wrap gap-3">
                {data.ultimoConcurso.dezenasSegundoSorteio.map((num, idx) => (
                  <NumberBall key={`s2-${num}-${idx}`} number={num} size="lg" variant="secondary" />
                ))}
              </div>
            </div>
          )}

          {/* Time do Coração / Mês da Sorte inline with last contest */}
          {data.timeCoracaoInfo?.valorAtual && (
            <div className="mb-4 flex items-center gap-3">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ backgroundColor: `${color}20`, border: `1px solid ${color}50` }}
              >
                {data.timeCoracaoInfo.tipoInfo === 'TIME_CORACAO' ? (
                  <Heart className="w-5 h-5 text-red-400" />
                ) : (
                  <Calendar className="w-5 h-5 text-orange-400" />
                )}
                <span className="text-text-tertiary text-sm">
                  {data.timeCoracaoInfo.tipoInfo === 'TIME_CORACAO' ? 'Time do Coração:' : 'Mês da Sorte:'}
                </span>
                <span className="text-text-primary font-bold">{data.timeCoracaoInfo.valorAtual}</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Prêmio Principal
              </p>
              <p className="text-text-primary font-bold">{formatCurrency(data.ultimoConcurso.premioFaixaPrincipal ?? 0)}</p>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm flex items-center gap-1">
                <Users className="w-4 h-4" /> Ganhadores
              </p>
              <p className="text-text-primary font-bold">{data.ultimoConcurso.ganhadoresFaixaPrincipal ?? 0}</p>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm">Status</p>
              <p className={data.ultimoConcurso.acumulou ? 'text-yellow-400 font-bold' : 'text-green-400 font-bold'}>
                {data.ultimoConcurso.acumulou ? 'ACUMULOU' : 'TEVE GANHADOR'}
              </p>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm">Acumulado</p>
              <p className="text-yellow-400 font-bold">{formatCurrency(data.ultimoConcurso.valorAcumulado)}</p>
            </div>
          </div>

          {/* Lista de Ganhadores */}
          {data.ultimoConcurso.ganhadores && data.ultimoConcurso.ganhadores.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-primary">
              <h3 className="text-sm font-medium text-text-tertiary mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" /> Detalhes dos Ganhadores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.ultimoConcurso.ganhadores.map((g) => (
                  <div key={`${g.uf}-${g.cidade}-${g.canal}`} className="bg-surface-secondary/30 rounded-lg p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary font-medium">
                        {g.cidade ? `${g.cidade}/${g.uf}` : g.uf || 'N/A'}
                      </span>
                      <span className="text-green-400 font-bold">{g.quantidade}x</span>
                    </div>
                    {g.canal && (
                      <span className="text-text-muted text-xs">{g.canal}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Último Concurso com Ganhador */}
      {data.ultimoConcursoComGanhador && (
        <div className="bg-gradient-to-r from-green-900/50 to-green-800/30 rounded-xl p-6 shadow-xl border border-green-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-400" />
              Último Concurso com Ganhador
            </h2>
            <div className="text-right">
              <span className="text-green-400 font-bold">#{data.ultimoConcursoComGanhador.numero}</span>
              <span className="text-text-tertiary ml-2">{formatDate(data.ultimoConcursoComGanhador.data)}</span>
              {data.ultimoConcursoComGanhador.concursosDesdeUltimoGanhador > 0 && (
                <p className="text-yellow-400 text-sm">
                  {data.ultimoConcursoComGanhador.concursosDesdeUltimoGanhador} concurso(s) sem ganhador desde então
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {data.ultimoConcursoComGanhador.dezenas?.map((num, idx) => (
              <NumberBall key={`g-${num}-${idx}`} number={num} size="lg" />
            ))}
          </div>

          {/* Second draw for Dupla Sena */}
          {data.ultimoConcursoComGanhador.dezenasSegundoSorteio && data.ultimoConcursoComGanhador.dezenasSegundoSorteio.length > 0 && (
            <div className="mb-4">
              <p className="text-text-tertiary text-sm mb-2">2º Sorteio</p>
              <div className="flex flex-wrap gap-3">
                {data.ultimoConcursoComGanhador.dezenasSegundoSorteio.map((num, idx) => (
                  <NumberBall key={`gs2-${num}-${idx}`} number={num} size="lg" variant="secondary" />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-surface-primary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm">Total de Ganhadores</p>
              <p className="text-green-400 font-bold text-lg">{data.ultimoConcursoComGanhador.totalGanhadores}</p>
            </div>
            <div className="bg-surface-primary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm">Prêmio por Ganhador</p>
              <p className="text-text-primary font-bold">{formatCurrency(data.ultimoConcursoComGanhador.premioPorGanhador)}</p>
            </div>
            <div className="bg-surface-primary/50 rounded-lg p-3 col-span-2">
              <p className="text-text-tertiary text-sm">Prêmio Total Distribuído</p>
              <p className="text-green-400 font-bold text-lg">{formatCurrency(data.ultimoConcursoComGanhador.premioTotal)}</p>
            </div>
          </div>

          {/* Lista de Ganhadores por Estado */}
          {data.ultimoConcursoComGanhador.ganhadores && data.ultimoConcursoComGanhador.ganhadores.length > 0 && (
            <div className="border-t border-green-700/50 pt-4">
              <h3 className="text-sm font-medium text-text-tertiary mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" /> Ganhadores por Local
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.ultimoConcursoComGanhador.ganhadores.map((g) => (
                  <div key={`${g.uf}-${g.cidade}-${g.canal}`} className="bg-surface-primary/50 rounded-lg p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary font-medium">
                        {g.cidade ? `${g.cidade}/${g.uf}` : g.uf || 'N/A'}
                      </span>
                      <span className="text-green-400 font-bold">{g.quantidade}x</span>
                    </div>
                    {g.canal && (
                      <span className="text-text-muted text-xs">{g.canal}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hot Numbers */}
        <div className="bg-surface-primary rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Números Quentes
          </h3>
          <p className="text-text-tertiary text-sm mb-3">Mais sorteados no histórico</p>
          <div className="flex flex-wrap gap-2">
            {sortedQuentes.map((num) => (
              <NumberBall key={num} number={num} size="sm" variant="hot" />
            ))}
          </div>
        </div>

        {/* Cold Numbers */}
        <div className="bg-surface-primary rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-500" />
            Números Frios
          </h3>
          <p className="text-text-tertiary text-sm mb-3">Menos sorteados no histórico</p>
          <div className="flex flex-wrap gap-2">
            {sortedFrios.map((num) => (
              <NumberBall key={num} number={num} size="sm" variant="cold" />
            ))}
          </div>
        </div>

        {/* Late Numbers */}
        <div className="bg-surface-primary rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Números Atrasados
          </h3>
          <p className="text-text-tertiary text-sm mb-3">Há mais tempo sem sair</p>
          <div className="flex flex-wrap gap-2">
            {sortedAtrasados.map((num) => (
              <NumberBall key={num} number={num} size="sm" variant="late" />
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Análise de Padrões</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-surface-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-text-primary">{(data.padroes?.mediaPares ?? 0).toFixed(1)}</p>
            <p className="text-text-tertiary text-sm">Média Pares</p>
          </div>
          <div className="text-center p-3 bg-surface-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-text-primary">{(data.padroes?.mediaImpares ?? 0).toFixed(1)}</p>
            <p className="text-text-tertiary text-sm">Média Ímpares</p>
          </div>
          <div className="text-center p-3 bg-surface-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-text-primary">{(data.padroes?.mediaBaixos ?? 0).toFixed(1)}</p>
            <p className="text-text-tertiary text-sm">Média Baixos</p>
          </div>
          <div className="text-center p-3 bg-surface-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-text-primary">{(data.padroes?.mediaAltos ?? 0).toFixed(1)}</p>
            <p className="text-text-tertiary text-sm">Média Altos</p>
          </div>
        </div>
      </div>

      {/* Time do Coração / Mês da Sorte */}
      {data.timeCoracaoInfo && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            {data.timeCoracaoInfo.tipoInfo === 'TIME_CORACAO' ? (
              <>
                <Heart className="w-5 h-5 text-red-500" />
                Time do Coração
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-orange-500" />
                Mês da Sorte
              </>
            )}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm">Último Sorteio</p>
              <p className="text-text-primary font-bold truncate" title={data.timeCoracaoInfo.valorAtual || '-'}>
                {data.timeCoracaoInfo.valorAtual || '-'}
              </p>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-red-400" /> Mais Frequente
              </p>
              <p className="text-red-400 font-bold truncate" title={data.timeCoracaoInfo.maisFrequente || '-'}>
                {data.timeCoracaoInfo.maisFrequente || '-'}
              </p>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-blue-400" /> Menos Frequente
              </p>
              <p className="text-blue-400 font-bold truncate" title={data.timeCoracaoInfo.menosFrequente || '-'}>
                {data.timeCoracaoInfo.menosFrequente || '-'}
              </p>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-3">
              <p className="text-text-tertiary text-sm flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" /> Mais Atrasado
              </p>
              <p className="text-purple-400 font-bold truncate" title={data.timeCoracaoInfo.maisAtrasado || '-'}>
                {data.timeCoracaoInfo.maisAtrasado || '-'}
              </p>
              {data.timeCoracaoInfo.atrasoMaisAtrasado > 0 && (
                <p className="text-text-muted text-xs">({data.timeCoracaoInfo.atrasoMaisAtrasado} sorteios)</p>
              )}
            </div>
          </div>

          {/* Top 5 */}
          {data.timeCoracaoInfo.top5 && data.timeCoracaoInfo.top5.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-primary">
              <h4 className="text-sm text-text-tertiary mb-2">Top 5 Mais Frequentes</h4>
              <div className="flex flex-wrap gap-2">
                {data.timeCoracaoInfo.top5.map((item, idx) => (
                  <span
                    key={item}
                    className="bg-surface-secondary text-text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    <span className="text-text-muted font-bold">{idx + 1}.</span> {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Contest */}
      {data.proximoConcurso && (
        <div className="bg-gradient-to-r from-surface-primary to-surface-secondary rounded-xl p-6 shadow-xl border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Próximo Concurso #{data.proximoConcurso.numero}</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-text-tertiary text-sm">Data Estimada</p>
              <p className="text-text-primary font-medium">{formatDate(data.proximoConcurso.dataEstimada)}</p>
            </div>
            <div>
              <p className="text-text-tertiary text-sm">Prêmio Estimado</p>
              <p className="text-green-400 font-bold text-xl">{formatCurrency(data.proximoConcurso.premioEstimado)}</p>
            </div>
            {data.proximoConcurso.acumulado && (
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold self-center">
                ACUMULADO
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-text-tertiary text-sm">Total de Concursos</p>
            <p className="text-text-primary font-bold text-xl">{data.resumo?.totalConcursos ?? 0}</p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm">Dias Sem Sorteio</p>
            <p className="text-text-primary font-bold text-xl">{data.resumo?.diasSemSorteio ?? 0}</p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm">Maior Prêmio</p>
            <p className="text-green-400 font-bold">{formatCurrency(data.resumo?.maiorPremio ?? 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
