'use client';

import { useState, useMemo } from 'react';
import { TipoLoteria, LOTERIAS, LOTERIA_CONFIG } from '@/lib/api';
import { Calculator, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ProbabilityCalculatorProps {
  tipo: TipoLoteria;
}

interface OddsTier {
  acertos: number;
  probabilidade: number;
  razao: string;
}

function combinations(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  const kk = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < kk; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

function formatRatio(prob: number): string {
  if (prob <= 0) return '—';
  if (prob >= 1) return '1 : 1';
  const ratio = 1 / prob;
  if (ratio >= 1_000_000_000) return `1 : ${(ratio / 1_000_000_000).toFixed(1)}B`;
  if (ratio >= 1_000_000) return `1 : ${(ratio / 1_000_000).toFixed(1)}M`;
  if (ratio >= 1_000) return `1 : ${(ratio / 1_000).toFixed(1)}K`;
  return `1 : ${ratio.toFixed(1)}`;
}

function formatPercent(prob: number): string {
  if (prob <= 0) return '0%';
  if (prob >= 1) return '100%';
  if (prob < 0.000001) return (prob * 100).toExponential(2) + '%';
  if (prob < 0.01) return (prob * 100).toFixed(6) + '%';
  return (prob * 100).toFixed(4) + '%';
}

// Standard lottery odds: C(acertos, drawn) * C(n - drawn, picked - acertos) / C(n, picked)
function calculateOdds(totalNumbers: number, drawnCount: number, pickedCount: number): OddsTier[] {
  const tiers: OddsTier[] = [];
  const totalCombinations = combinations(totalNumbers, pickedCount);

  for (let acertos = drawnCount; acertos >= Math.max(0, drawnCount - 6); acertos--) {
    if (acertos < 0) break;
    const waysToHit = combinations(drawnCount, acertos);
    const waysToMiss = combinations(totalNumbers - drawnCount, pickedCount - acertos);
    const favorable = waysToHit * waysToMiss;
    if (favorable <= 0) continue;
    const prob = favorable / totalCombinations;
    tiers.push({
      acertos,
      probabilidade: prob,
      razao: formatRatio(prob),
    });
  }

  return tiers;
}

// Official Caixa prize tiers
const PRIZE_TIERS: Record<string, { minAcertos: number; drawn: number }> = {
  mega_sena: { minAcertos: 4, drawn: 6 },
  lotofacil: { minAcertos: 11, drawn: 15 },
  quina: { minAcertos: 2, drawn: 5 },
  lotomania: { minAcertos: 15, drawn: 20 }, // also wins with 0
  timemania: { minAcertos: 3, drawn: 7 },
  dupla_sena: { minAcertos: 3, drawn: 6 },
  dia_de_sorte: { minAcertos: 4, drawn: 7 },
  super_sete: { minAcertos: 3, drawn: 7 },
  mais_milionaria: { minAcertos: 2, drawn: 6 },
};

const JACKPOT_LABELS: Record<string, string> = {
  mega_sena: 'Sena',
  lotofacil: '15 acertos',
  quina: 'Quina',
  lotomania: '20 acertos',
  timemania: '7 acertos',
  dupla_sena: 'Sena',
  dia_de_sorte: '7 acertos',
  super_sete: '7 acertos',
  mais_milionaria: '6 acertos',
};

export function ProbabilityCalculator({ tipo }: ProbabilityCalculatorProps) {
  const config = LOTERIA_CONFIG[tipo];
  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
  const color = loteriaInfo?.color || '#666';
  const prizeTier = PRIZE_TIERS[tipo];

  const [pickedCount, setPickedCount] = useState(config.min);
  const [showExplanation, setShowExplanation] = useState(false);

  const isSpecial = tipo === 'super_sete' || tipo === 'lotomania';

  const odds = useMemo(() => {
    if (tipo === 'super_sete') {
      // Super Sete: 7 columns, each 0-9. pickedCount = total selections across columns
      // Each column is independent: 1/10 chance per column
      // For k correct out of 7: C(7,k) * (1/10)^k * (9/10)^(7-k)... but with multiple picks
      // Simplified: standard pick from 7 columns
      const tiers: OddsTier[] = [];
      const cols = 7;
      for (let acertos = cols; acertos >= 3; acertos--) {
        const ways = combinations(cols, acertos);
        // Each column: if 1 number picked, 1/10 chance. With n picks per column: n/10
        const picksPerCol = Math.min(Math.floor(pickedCount / 7), 3) || 1;
        const pHit = picksPerCol / 10;
        const pMiss = 1 - pHit;
        const prob = Number(ways) * Math.pow(pHit, acertos) * Math.pow(pMiss, cols - acertos);
        tiers.push({
          acertos,
          probabilidade: prob,
          razao: formatRatio(prob),
        });
      }
      return tiers;
    }

    const totalNumbers = config.numeroFinal - config.numeroInicial + 1;
    return calculateOdds(totalNumbers, prizeTier.drawn, pickedCount);
  }, [tipo, pickedCount, config, prizeTier]);

  const filteredOdds = useMemo(() => {
    if (!prizeTier) return odds;
    return odds.filter(t => t.acertos >= prizeTier.minAcertos || (tipo === 'lotomania' && t.acertos === 0));
  }, [odds, prizeTier, tipo]);

  // Total chance of winning any prize
  const totalWinChance = useMemo(() => {
    return filteredOdds.reduce((sum, t) => sum + t.probabilidade, 0);
  }, [filteredOdds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg" style={{ borderTop: `4px solid ${color}` }}>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5" style={{ color }} />
          Calculadora de Probabilidades
        </h2>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-text-secondary text-sm">Números apostados:</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={config.min}
              max={config.max}
              value={pickedCount}
              onChange={e => setPickedCount(Number(e.target.value))}
              className="w-48 accent-current"
              style={{ accentColor: color }}
            />
            <span className="text-text-primary font-bold text-lg min-w-[2rem] text-center">{pickedCount}</span>
          </div>
          <span className="text-text-muted text-xs">({config.min} a {config.max})</span>
        </div>

        {/* Total win chance */}
        <div className="bg-surface-secondary/50 rounded-lg p-4 flex items-center justify-between">
          <span className="text-text-secondary">Chance total de ganhar qualquer prêmio:</span>
          <div className="text-right">
            <span className="text-green-400 font-bold text-lg">{formatPercent(totalWinChance)}</span>
            <span className="text-text-muted text-sm ml-2">({formatRatio(totalWinChance)})</span>
          </div>
        </div>

        {(tipo === 'timemania' || tipo === 'dia_de_sorte') && (
          <p className="text-text-muted text-xs mt-2">
            * {tipo === 'timemania' ? 'Não inclui o prêmio do Time do Coração.' : 'Não inclui o Mês de Sorte.'}
          </p>
        )}
      </div>

      {/* Odds Table */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Probabilidades por Faixa</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-text-tertiary font-medium py-2 px-3">Acertos</th>
                <th className="text-right text-text-tertiary font-medium py-2 px-3">Probabilidade</th>
                <th className="text-right text-text-tertiary font-medium py-2 px-3">Chances</th>
                <th className="text-left text-text-tertiary font-medium py-2 px-3 w-1/3">Visualização</th>
              </tr>
            </thead>
            <tbody>
              {filteredOdds.map((tier) => {
                const barWidth = Math.max(tier.probabilidade * 100 * (tipo === 'lotofacil' ? 10 : 1000), 1);
                const isJackpot = tier.acertos === prizeTier.drawn;
                return (
                  <tr key={tier.acertos} className={`border-b border-border-primary/50 ${isJackpot ? 'bg-yellow-500/10' : ''}`}>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${isJackpot ? 'text-yellow-400' : 'text-text-primary'}`}>
                        {tier.acertos} acerto{tier.acertos !== 1 ? 's' : ''}
                      </span>
                      {isJackpot && <span className="ml-2 text-yellow-400 text-xs">({JACKPOT_LABELS[tipo] || `${tier.acertos} acertos`})</span>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-text-primary font-mono">{formatPercent(tier.probabilidade)}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-text-secondary font-mono">{tier.razao}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-surface-secondary rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${Math.min(barWidth, 100)}%`,
                            backgroundColor: isJackpot ? '#EAB308' : color,
                            opacity: isJackpot ? 1 : 0.7,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {tipo === 'lotomania' && (
          <p className="text-text-muted text-xs mt-3 italic">
            * Na Lotomania, acertar 0 números também é premiado.
          </p>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary w-full"
        >
          <Info className="w-5 h-5" />
          <span className="font-medium">Como funciona o cálculo?</span>
          {showExplanation ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>

        {showExplanation && (
          <div className="mt-4 text-text-secondary text-sm space-y-2">
            <p>
              A probabilidade é calculada usando <strong>análise combinatória</strong>. Para uma loteria com{' '}
              <strong>N</strong> números possíveis, <strong>D</strong> dezenas sorteadas e <strong>P</strong> números apostados:
            </p>
            <div className="bg-surface-secondary/50 rounded-lg p-3 font-mono text-center">
              P(k acertos) = C(D,k) × C(N-D, P-k) / C(N, P)
            </div>
            <p>
              Onde C(n,k) = n! / (k! × (n-k)!) é o número de combinações.
            </p>
            <p>
              Quanto mais números você aposta, maiores as chances — mas o custo da aposta também aumenta exponencialmente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
