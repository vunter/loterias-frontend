'use client';

import { useState, useEffect, useCallback } from 'react';
import { TipoLoteria, LOTERIAS } from '@/lib/api';
import { formatDateTime } from '@/lib/formatters';
import { writeToClipboard } from '@/lib/game-export';
import logger from '@/lib/logger';
import { NumberBall } from './NumberBall';
import { History, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface JogoSalvo {
  id: string;
  tipo: TipoLoteria;
  jogos: number[][];
  estrategia: string;
  geradoEm: string;
  timeSugerido?: string | null;
  mesSugerido?: string | null;
  timesSugeridos?: string[] | null;
  mesesSugeridos?: string[] | null;
}

interface JogosHistoricoProps {
  tipo: TipoLoteria;
  onJogoGerado?: (jogo: JogoSalvo) => void;
}

const STORAGE_KEY = 'loterias-historico-jogos';
const MAX_HISTORICO = 50;

export function salvarJogoNoHistorico(jogo: Omit<JogoSalvo, 'id'>) {
  const historico = getHistorico();
  const novoJogo: JogoSalvo = {
    ...jogo,
    id: `${Date.now()}-${crypto.randomUUID()}`
  };
  
  historico.unshift(novoJogo);
  
  if (historico.length > MAX_HISTORICO) {
    historico.splice(MAX_HISTORICO);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
  } catch {
    // localStorage may be unavailable or full
  }
  return novoJogo;
}

export function getHistorico(): JogoSalvo[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function removerDoHistorico(id: string) {
  const historico = getHistorico().filter(j => j.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
  } catch {
    // localStorage may be unavailable or full
  }
  return historico;
}

export function limparHistorico(tipo?: TipoLoteria) {
  try {
    if (tipo) {
      const historico = getHistorico().filter(j => j.tipo !== tipo);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
      return historico;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may be unavailable or full
  }
  return [];
}

export function JogosHistorico({ tipo }: JogosHistoricoProps) {
  const [historico, setHistorico] = useState<JogoSalvo[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  
  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);

  useEffect(() => {
    setHistorico(getHistorico().filter(j => j.tipo === tipo));
    setConfirmingClear(false);
  }, [tipo]);

  const handleRemover = (id: string) => {
    const novoHistorico = removerDoHistorico(id);
    setHistorico(novoHistorico.filter(j => j.tipo === tipo));
  };

  const handleLimparTudo = () => {
    const novoHistorico = limparHistorico(tipo);
    setHistorico(novoHistorico.filter(j => j.tipo === tipo));
    setConfirmingClear(false);
  };

  const handleCopiar = async (jogo: JogoSalvo) => {
    const text = jogo.jogos.map((j, i) => {
      let linha = `Jogo ${i + 1}: ${j.map(n => n.toString().padStart(2, '0')).join(', ')}`;
      const time = jogo.timesSugeridos?.[i] || (i === 0 ? jogo.timeSugerido : null);
      const mes = jogo.mesesSugeridos?.[i] || (i === 0 ? jogo.mesSugerido : null);
      if (time) linha += ` | Time: ${time}`;
      if (mes) linha += ` | Mês: ${mes}`;
      return linha;
    }).join('\n');
    
    try {
      await writeToClipboard(text);
      setCopiedId(jogo.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      logger.warn({ err }, 'Clipboard copy failed');
    }
  };

  const formatDate = (dateStr: string) => formatDateTime(dateStr);

  if (historico.length === 0) {
    return (
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5" style={{ color: loteriaInfo?.color }} />
          <h3 className="text-lg font-semibold text-text-primary">Histórico de Jogos</h3>
        </div>
        <p className="text-text-tertiary text-center py-8">
          Nenhum jogo salvo para {loteriaInfo?.label}. Gere jogos para salvá-los automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" style={{ color: loteriaInfo?.color }} />
          <h3 className="text-lg font-semibold text-text-primary">Histórico de Jogos</h3>
          <span className="text-text-muted text-sm">({historico.length})</span>
        </div>
        {confirmingClear ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLimparTudo}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Confirmar?
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="text-text-tertiary hover:text-text-secondary text-sm"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingClear(true)}
            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Limpar tudo
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {historico.map((jogo) => (
          <div
            key={jogo.id}
            className="bg-surface-secondary/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary text-sm">{formatDate(jogo.geradoEm)}</span>
                <span className="bg-surface-tertiary text-text-secondary text-xs px-2 py-0.5 rounded">
                  {jogo.estrategia}
                </span>
                <span className="text-text-muted text-xs">
                  {jogo.jogos.length} jogo{jogo.jogos.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopiar(jogo)}
                  className="p-1.5 hover:bg-surface-tertiary rounded transition-colors"
                  title="Copiar jogos"
                >
                  {copiedId === jogo.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-tertiary" />
                  )}
                </button>
                <button
                  onClick={() => setExpanded(expanded === jogo.id ? null : jogo.id)}
                  className="p-1.5 hover:bg-surface-tertiary rounded transition-colors"
                  title="Expandir/Recolher"
                >
                  {expanded === jogo.id ? (
                    <ChevronUp className="w-4 h-4 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                  )}
                </button>
                <button
                  onClick={() => handleRemover(jogo.id)}
                  className="p-1.5 hover:bg-red-900/50 rounded transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {jogo.jogos[0]?.map((num, i) => (
                <NumberBall key={i} number={num} size="sm" />
              ))}
              {jogo.jogos.length > 1 && (
                <span className="text-text-muted text-xs self-center ml-2">
                  +{jogo.jogos.length - 1} jogo(s)
                </span>
              )}
            </div>

            {expanded === jogo.id && jogo.jogos.length > 1 && (
              <div className="mt-3 pt-3 border-t border-border-primary space-y-2">
                {jogo.jogos.slice(1).map((j, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-text-muted text-xs w-12">#{idx + 2}</span>
                    <div className="flex flex-wrap gap-1">
                      {j.map((num, i) => (
                        <NumberBall key={i} number={num} size="sm" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(jogo.timesSugeridos?.length || jogo.mesesSugeridos?.length || jogo.timeSugerido || jogo.mesSugerido) && (
              <div className="mt-2 text-xs text-text-tertiary space-y-1">
                {jogo.timesSugeridos && jogo.timesSugeridos.length > 0 ? (
                  <div>Times: {jogo.timesSugeridos.join(', ')}</div>
                ) : jogo.timeSugerido && (
                  <div>Time: {jogo.timeSugerido}</div>
                )}
                {jogo.mesesSugeridos && jogo.mesesSugeridos.length > 0 ? (
                  <div>Meses: {jogo.mesesSugeridos.join(', ')}</div>
                ) : jogo.mesSugerido && (
                  <div>Mês: {jogo.mesSugerido}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
