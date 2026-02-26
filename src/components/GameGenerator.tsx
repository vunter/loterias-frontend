'use client';

import { useState, useEffect } from 'react';
import { api, TipoLoteria, Estrategia, GerarJogoResponse, GerarJogoRequest, LOTERIAS } from '@/lib/api';
import { LOTERIA_CONFIG } from '@/lib/loterias';
import { writeToClipboard, downloadFile, formatAllGamesText, generateCSV, generateTXT } from '@/lib/game-export';
import logger from '@/lib/logger';
import { NumberBall } from './NumberBall';
import { JogosHistorico, salvarJogoNoHistorico } from './JogosHistorico';
import { Dices, Loader2, Copy, Check, Settings, Zap, Brain, ChevronDown, ChevronUp, Heart, CalendarDays, Download, FileText, ClipboardList } from 'lucide-react';
import { ShareButtons } from './ShareButtons';

interface GameGeneratorProps {
  tipo: TipoLoteria;
}

type GeneratorMode = 'estrategico' | 'personalizado';

export function GameGenerator({ tipo }: GameGeneratorProps) {
  const [mode, setMode] = useState<GeneratorMode>('estrategico');
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [selectedEstrategia, setSelectedEstrategia] = useState('ALEATORIO');
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GerarJogoResponse | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [historicoKey, setHistoricoKey] = useState(0);

  // Opções personalizadas
  const [quantidadeNumeros, setQuantidadeNumeros] = useState(LOTERIA_CONFIG[tipo].min);
  const [usarNumerosQuentes, setUsarNumerosQuentes] = useState(false);
  const [usarNumerosFrios, setUsarNumerosFrios] = useState(false);
  const [usarNumerosAtrasados, setUsarNumerosAtrasados] = useState(false);
  const [balancearParesImpares, setBalancearParesImpares] = useState(false);
  const [evitarSequenciais, setEvitarSequenciais] = useState(false);
  const [numerosObrigatorios, setNumerosObrigatorios] = useState<number[]>([]);
  const [numerosExcluidos, setNumerosExcluidos] = useState<number[]>([]);
  const [showNumberSelector, setShowNumberSelector] = useState<'obrigatorios' | 'excluidos' | null>(null);
  const [sugerirTime, setSugerirTime] = useState<string>('');
  const [sugerirMes, setSugerirMes] = useState<string>('');
  const [quantidadeTrevos, setQuantidadeTrevos] = useState(2);


  const loteriaInfo = LOTERIAS.find(l => l.value === tipo);
  const config = LOTERIA_CONFIG[tipo];

  useEffect(() => {
    const controller = new AbortController();
    api.getEstrategias({ signal: controller.signal })
      .then(setEstrategias)
      .catch(err => {
        if (err?.name === 'AbortError') return;
        logger.error({ err }, 'Failed to load strategies');
        setError('Não foi possível carregar as estratégias');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setQuantidadeNumeros(LOTERIA_CONFIG[tipo].min);
    setNumerosObrigatorios([]);
    setNumerosExcluidos([]);
    setSugerirTime('');
    setSugerirMes('');
    setQuantidadeTrevos(2);
  }, [tipo]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setDebugExpanded(false);
    try {
      let data: GerarJogoResponse;
      
      if (mode === 'estrategico') {
        const trevos = tipo === 'mais_milionaria' ? quantidadeTrevos : undefined;
        data = await api.gerarJogosEstrategico(tipo, selectedEstrategia, quantidade, quantidadeNumeros, showDebug, trevos);
      } else {
        const request: GerarJogoRequest = {
          quantidadeNumeros,
          quantidadeJogos: quantidade,
          usarNumerosQuentes: usarNumerosQuentes || undefined,
          usarNumerosFrios: usarNumerosFrios || undefined,
          usarNumerosAtrasados: usarNumerosAtrasados || undefined,
          balancearParesImpares: balancearParesImpares || undefined,
          evitarSequenciais: evitarSequenciais || undefined,
          numerosObrigatorios: numerosObrigatorios.length > 0 ? numerosObrigatorios : undefined,
          numerosExcluidos: numerosExcluidos.length > 0 ? numerosExcluidos : undefined,
          sugerirTime: tipo === 'timemania' && sugerirTime ? sugerirTime : undefined,
          sugerirMes: tipo === 'dia_de_sorte' && sugerirMes ? sugerirMes : undefined,
          quantidadeTrevos: tipo === 'mais_milionaria' ? quantidadeTrevos : undefined,
        };
        data = await api.gerarJogosPersonalizado(tipo, request, showDebug);
      }
      
      setResult(data);
      
      // Salvar no histórico
      salvarJogoNoHistorico({
        tipo,
        jogos: data.jogos,
        estrategia: data.estrategia,
        geradoEm: new Date().toISOString(),
        timeSugerido: data.timeSugerido,
        mesSugerido: data.mesSugerido,
        timesSugeridos: data.timesSugeridos,
        mesesSugeridos: data.mesesSugeridos,
      });
      setHistoricoKey(prev => prev + 1);
    } catch (err) {
      logger.error({ err }, 'Failed to generate games');
      setError('Erro ao gerar jogos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (jogo: number[], index: number) => {
    try {
      await writeToClipboard(jogo.join(', '));
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      logger.warn({ err }, 'Clipboard copy failed');
    }
  };

  const copyAllToClipboard = async () => {
    if (!result) return;
    try {
      await writeToClipboard(formatAllGamesText(result));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      logger.warn({ err }, 'Clipboard copy failed');
    }
  };

  const downloadCSV = () => {
    if (!result) return;
    downloadFile(generateCSV(result), `jogos-${result.tipoLoteria}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  };

  const downloadTXT = () => {
    if (!result) return;
    downloadFile(generateTXT(result), `jogos-${result.tipoLoteria}-${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
  };

  const toggleNumber = (num: number, list: 'obrigatorios' | 'excluidos') => {
    // Super Sete: column order matters, preserve selection order
    const shouldSort = tipo !== 'super_sete';
    const addSorted = (arr: number[], n: number) => {
      const next = [...arr, n];
      return shouldSort ? next.sort((a, b) => a - b) : next;
    };

    if (list === 'obrigatorios') {
      if (numerosObrigatorios.includes(num)) {
        setNumerosObrigatorios(numerosObrigatorios.filter(n => n !== num));
      } else if (numerosObrigatorios.length < quantidadeNumeros - 1) {
        setNumerosObrigatorios(addSorted(numerosObrigatorios, num));
        if (numerosExcluidos.includes(num)) {
          setNumerosExcluidos(numerosExcluidos.filter(n => n !== num));
        }
      }
    } else {
      if (numerosExcluidos.includes(num)) {
        setNumerosExcluidos(numerosExcluidos.filter(n => n !== num));
      } else {
        setNumerosExcluidos(addSorted(numerosExcluidos, num));
        if (numerosObrigatorios.includes(num)) {
          setNumerosObrigatorios(numerosObrigatorios.filter(n => n !== num));
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Dices className="w-6 h-6" style={{ color: loteriaInfo?.color }} />
          Gerador de Jogos - {loteriaInfo?.label}
        </h2>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('estrategico')}
            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              mode === 'estrategico'
                ? 'bg-blue-600 text-white'
                : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
            }`}
          >
            <Zap className="w-5 h-5" />
            Estratégia Pronta
          </button>
          <button
            onClick={() => setMode('personalizado')}
            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              mode === 'personalizado'
                ? 'bg-blue-600 text-white'
                : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary'
            }`}
          >
            <Settings className="w-5 h-5" />
            Personalizado
          </button>
        </div>

        {mode === 'estrategico' ? (
          /* Strategic Mode */
          <div className="space-y-4">
            <div>
              <label className="block text-text-tertiary text-sm mb-2">Estratégia</label>
              <select
                value={selectedEstrategia}
                onChange={(e) => setSelectedEstrategia(e.target.value)}
                className="w-full bg-surface-secondary text-text-primary rounded-lg px-4 py-3 border border-border-secondary focus:border-blue-500 focus:outline-none"
              >
                {estrategias.map((e) => (
                  <option key={e.codigo} value={e.codigo}>
                    {e.nome}
                  </option>
                ))}
              </select>
              {estrategias.find(e => e.codigo === selectedEstrategia) && (
                <p className="text-text-muted text-sm mt-1">
                  {estrategias.find(e => e.codigo === selectedEstrategia)?.descricao}
                </p>
              )}
            </div>

            {/* Quantity of numbers - also in strategic mode */}
            {config.min !== config.max && (
              <div>
                <label className="block text-text-tertiary text-sm mb-2">
                  Quantidade de Números ({config.min} - {config.max})
                </label>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  value={quantidadeNumeros}
                  onChange={(e) => setQuantidadeNumeros(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-text-primary font-bold">{quantidadeNumeros}</div>
              </div>
            )}

            {/* Trevos selector for +Milionária in strategic mode */}
            {tipo === 'mais_milionaria' && (
              <div>
                <label className="block text-text-tertiary text-sm mb-2">
                  Quantidade de Trevos (2 - 6)
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={quantidadeTrevos}
                  onChange={(e) => setQuantidadeTrevos(parseInt(e.target.value))}
                  className="w-full accent-yellow-500"
                />
                <div className="text-center text-text-primary font-bold">
                  {quantidadeTrevos} 🍀
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Custom Mode */
          <div className="space-y-4">
            {/* Quantity of numbers */}
            <div>
              <label className="block text-text-tertiary text-sm mb-2">
                Quantidade de Números ({config.min} - {config.max})
              </label>
              <input
                type="range"
                min={config.min}
                max={config.max}
                value={quantidadeNumeros}
                onChange={(e) => setQuantidadeNumeros(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-text-primary font-bold">{quantidadeNumeros}</div>
            </div>

            {/* Boolean options */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 bg-surface-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={usarNumerosQuentes}
                  onChange={(e) => setUsarNumerosQuentes(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-text-primary">Números Quentes</span>
              </label>
              <label className="flex items-center gap-2 bg-surface-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={usarNumerosFrios}
                  onChange={(e) => setUsarNumerosFrios(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-text-primary">Números Frios</span>
              </label>
              <label className="flex items-center gap-2 bg-surface-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={usarNumerosAtrasados}
                  onChange={(e) => setUsarNumerosAtrasados(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-text-primary">Números Atrasados</span>
              </label>
              <label className="flex items-center gap-2 bg-surface-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={balancearParesImpares}
                  onChange={(e) => setBalancearParesImpares(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-text-primary">Balancear Par/Ímpar</span>
              </label>
              <label className="flex items-center gap-2 bg-surface-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={evitarSequenciais}
                  onChange={(e) => setEvitarSequenciais(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-text-primary">Evitar Sequenciais</span>
              </label>
            </div>

            {/* Time do Coração selector for Timemania */}
            {tipo === 'timemania' && (
              <div className="col-span-full">
                <label className="block text-text-tertiary text-sm mb-2">
                  Sugestão de Time do Coração
                </label>
                <select
                  value={sugerirTime}
                  onChange={(e) => setSugerirTime(e.target.value)}
                  className="w-full bg-surface-secondary text-text-primary rounded-lg px-4 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Não sugerir</option>
                  <option value="quente">Mais frequente (quente)</option>
                  <option value="frio">Menos frequente (frio)</option>
                  <option value="atrasado">Há mais tempo sem sair</option>
                  <option value="aleatorio">Aleatório</option>
                </select>
              </div>
            )}

            {/* Mês da Sorte selector for Dia de Sorte */}
            {tipo === 'dia_de_sorte' && (
              <div className="col-span-full">
                <label className="block text-text-tertiary text-sm mb-2">
                  Sugestão de Mês da Sorte
                </label>
                <select
                  value={sugerirMes}
                  onChange={(e) => setSugerirMes(e.target.value)}
                  className="w-full bg-surface-secondary text-text-primary rounded-lg px-4 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Não sugerir</option>
                  <option value="quente">Mais frequente (quente)</option>
                  <option value="frio">Menos frequente (frio)</option>
                  <option value="atrasado">Há mais tempo sem sair</option>
                  <option value="aleatorio">Aleatório</option>
                </select>
              </div>
            )}

            {/* Trevos selector for +Milionária */}
            {tipo === 'mais_milionaria' && (
              <div className="col-span-full">
                <label className="block text-text-tertiary text-sm mb-2">
                  Quantidade de Trevos (2 - 6)
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={quantidadeTrevos}
                  onChange={(e) => setQuantidadeTrevos(parseInt(e.target.value))}
                  className="w-full accent-yellow-500"
                />
                <div className="text-center text-text-primary font-bold">
                  {quantidadeTrevos} 🍀
                </div>
              </div>
            )}

            {/* Number selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mandatory numbers */}
              <div>
                <button
                  onClick={() => setShowNumberSelector(showNumberSelector === 'obrigatorios' ? null : 'obrigatorios')}
                  className="w-full text-left bg-surface-secondary/50 p-3 rounded-lg hover:bg-surface-secondary"
                >
                  <span className="text-sm text-text-tertiary">Números Obrigatórios</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {numerosObrigatorios.length > 0 ? (
                      numerosObrigatorios.map(n => (
                        <span key={n} className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-muted text-sm">Clique para selecionar</span>
                    )}
                  </div>
                </button>
              </div>

              {/* Excluded numbers */}
              <div>
                <button
                  onClick={() => setShowNumberSelector(showNumberSelector === 'excluidos' ? null : 'excluidos')}
                  className="w-full text-left bg-surface-secondary/50 p-3 rounded-lg hover:bg-surface-secondary"
                >
                  <span className="text-sm text-text-tertiary">Números Excluídos</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {numerosExcluidos.length > 0 ? (
                      numerosExcluidos.map(n => (
                        <span key={n} className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))
                    ) : (
                      <span className="text-text-muted text-sm">Clique para selecionar</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Number grid popup */}
            {showNumberSelector && (
              <div className="bg-surface-secondary rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-text-primary font-medium">
                    {showNumberSelector === 'obrigatorios' ? 'Selecione números obrigatórios' : 'Selecione números a excluir'}
                  </span>
                  <button
                    onClick={() => showNumberSelector === 'obrigatorios' ? setNumerosObrigatorios([]) : setNumerosExcluidos([])}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    Limpar
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: config.numeroFinal - config.numeroInicial + 1 }, (_, i) => config.numeroInicial + i).map((num) => {
                    const isObrigatorio = numerosObrigatorios.includes(num);
                    const isExcluido = numerosExcluidos.includes(num);
                    return (
                      <button
                        key={num}
                        onClick={() => toggleNumber(num, showNumberSelector)}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                          showNumberSelector === 'obrigatorios'
                            ? isObrigatorio
                              ? 'bg-green-600 text-white'
                              : isExcluido
                              ? 'bg-red-600/50 text-red-300 cursor-not-allowed'
                              : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/70'
                            : isExcluido
                            ? 'bg-red-600 text-white'
                            : isObrigatorio
                            ? 'bg-green-600/50 text-green-300 cursor-not-allowed'
                            : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/70'
                        }`}
                      >
                        {num.toString().padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quantity of games */}
        <div className="mt-4">
          <label className="block text-text-tertiary text-sm mb-2">Quantidade de Jogos (1-10)</label>
          <input
            type="number"
            min={1}
            max={10}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full bg-surface-secondary text-text-primary rounded-lg px-4 py-3 border border-border-secondary focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Debug option */}
        <label className="flex items-center gap-3 mt-4 bg-surface-secondary/50 p-3 rounded-lg cursor-pointer hover:bg-surface-secondary">
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <Brain className="w-5 h-5 text-purple-400" />
          <div>
            <span className="text-sm text-text-primary">Mostrar raciocínio</span>
            <p className="text-xs text-text-muted">Exibe o processo de geração e critérios utilizados</p>
          </div>
        </label>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: loteriaInfo?.color }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Dices className="w-5 h-5" />
              Gerar Jogos
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Jogos Gerados ({result.jogos.length})
          </h3>
          <p className="text-text-tertiary text-sm mb-4">{result.estrategia}</p>

          <div className="space-y-4">
            {result.jogos.map((jogo, i) => {
              const isMaisMilionaria = tipo === 'mais_milionaria';
              const qtdDezenas = result.quantidadeDezenas ?? 6;
              const dezenas = isMaisMilionaria ? jogo.slice(0, qtdDezenas) : jogo;
              const trevos = isMaisMilionaria ? jogo.slice(qtdDezenas) : [];
              const timeSugeridoJogo = result.timesSugeridos?.[i] || (i === 0 ? result.timeSugerido : null);
              const mesSugeridoJogo = result.mesesSugeridos?.[i] || (i === 0 ? result.mesSugerido : null);
              
              return (
                <div
                  key={i}
                  className="bg-surface-secondary/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-text-tertiary font-mono text-sm">#{i + 1}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {dezenas.map((num, j) => (
                          <NumberBall key={j} number={num} size="sm" variant="selected" />
                        ))}
                        
                        {isMaisMilionaria && trevos.length > 0 && (
                          <>
                            <span className="text-text-muted mx-1">+</span>
                            <div className="flex items-center gap-1 bg-yellow-600/20 px-2 py-1 rounded-lg border border-yellow-600/50">
                              <span className="text-yellow-400 text-sm mr-1">🍀</span>
                              {trevos.map((num, j) => (
                                <span
                                  key={j}
                                  className="w-7 h-7 rounded-full bg-yellow-600 text-white font-bold text-sm flex items-center justify-center"
                                >
                                  {num}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(jogo, i)}
                      className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
                      title="Copiar números"
                    >
                      {copied === i ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-text-tertiary" />
                      )}
                    </button>
                  </div>
                  {/* Time/Mês por jogo */}
                  {(timeSugeridoJogo || mesSugeridoJogo) && (
                    <div className="mt-2 ml-8 flex items-center gap-3 text-sm">
                      {timeSugeridoJogo && (
                        <span className="flex items-center gap-1.5 text-red-400">
                          <Heart className="w-4 h-4" />
                          <span className="text-text-tertiary">Time:</span>
                          <span className="font-medium text-text-primary">{timeSugeridoJogo}</span>
                        </span>
                      )}
                      {mesSugeridoJogo && (
                        <span className="flex items-center gap-1.5 text-orange-400">
                          <CalendarDays className="w-4 h-4" />
                          <span className="text-text-tertiary">Mês:</span>
                          <span className="font-medium text-text-primary">{mesSugeridoJogo}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border-primary">
            <button
              onClick={copyAllToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-text-primary"
            >
              {copiedAll ? <Check className="w-4 h-4 text-green-400" /> : <ClipboardList className="w-4 h-4" />}
              {copiedAll ? 'Copiado!' : 'Copiar Todos'}
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-text-primary"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={downloadTXT}
              className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-text-primary"
            >
              <FileText className="w-4 h-4" />
              TXT
            </button>
          </div>

          {/* Social Sharing */}
          <div className="mt-3 pt-3 border-t border-border-primary">
            <ShareButtons tipo={tipo} result={result} />
          </div>

          {/* Debug Section */}
          {result.debug && (
            <div className="mt-6 border-t border-border-primary pt-4">
              <button
                onClick={() => setDebugExpanded(!debugExpanded)}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 w-full"
              >
                <Brain className="w-5 h-5" />
                <span className="font-medium">Raciocínio da Geração</span>
                {debugExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
              </button>
              
              {debugExpanded && (
                <div className="mt-4 space-y-4">
                  {/* Etapas */}
                  <div className="bg-bg-secondary rounded-lg p-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">📋 Etapas do Processo</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {result.debug.etapas?.map((etapa, i) => (
                        <li key={i} className="text-sm text-text-tertiary">{etapa}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Números Quentes/Frios/Atrasados */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {result.debug.numerosQuentes?.length > 0 && (
                      <div className="bg-bg-secondary rounded-lg p-3">
                        <h4 className="text-xs font-medium text-red-400 mb-2">🔥 Top 10 Quentes</h4>
                        <div className="flex flex-wrap gap-1">
                          {[...result.debug.numerosQuentes].sort((a, b) => a - b).map(n => (
                            <span key={n} className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                              {n.toString().padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.debug.numerosFrios?.length > 0 && (
                      <div className="bg-bg-secondary rounded-lg p-3">
                        <h4 className="text-xs font-medium text-blue-400 mb-2">❄️ Top 10 Frios</h4>
                        <div className="flex flex-wrap gap-1">
                          {[...result.debug.numerosFrios].sort((a, b) => a - b).map(n => (
                            <span key={n} className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              {n.toString().padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.debug.numerosAtrasados?.length > 0 && (
                      <div className="bg-bg-secondary rounded-lg p-3">
                        <h4 className="text-xs font-medium text-purple-400 mb-2">⏰ Top 10 Atrasados</h4>
                        <div className="flex flex-wrap gap-1">
                          {[...result.debug.numerosAtrasados].sort((a, b) => a - b).map(n => (
                            <span key={n} className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              {n.toString().padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Análise Time do Coração / Mês da Sorte */}
                  {result.debug.timeCoracaoDebug && (
                    <div className="bg-gradient-to-r from-bg-secondary to-surface-primary rounded-lg p-4 border border-border-primary">
                      <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                        {result.debug.timeCoracaoDebug.tipo === 'TIME_CORACAO' ? (
                          <>
                            <Heart className="w-4 h-4 text-red-400" />
                            Análise do Time do Coração
                          </>
                        ) : (
                          <>
                            <CalendarDays className="w-4 h-4 text-orange-400" />
                            Análise do Mês da Sorte
                          </>
                        )}
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-surface-primary rounded p-2">
                          <p className="text-text-muted text-xs">Estratégia</p>
                          <p className="text-text-primary font-medium text-sm uppercase">{result.debug.timeCoracaoDebug.estrategiaUsada}</p>
                        </div>
                        <div className="bg-surface-primary rounded p-2">
                          <p className="text-text-muted text-xs">Selecionado</p>
                          <p className="text-green-400 font-bold text-sm truncate" title={result.debug.timeCoracaoDebug.sugestao}>
                            {result.debug.timeCoracaoDebug.sugestao}
                          </p>
                        </div>
                        <div className="bg-surface-primary rounded p-2">
                          <p className="text-text-muted text-xs">Frequência</p>
                          <p className="text-text-primary font-medium text-sm">
                            {result.debug.timeCoracaoDebug.frequenciaSugestao}x ({result.debug.timeCoracaoDebug.percentualSugestao.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="bg-surface-primary rounded p-2">
                          <p className="text-text-muted text-xs">Atraso</p>
                          <p className="text-purple-400 font-medium text-sm">{result.debug.timeCoracaoDebug.atrasoSugestao} sorteios</p>
                        </div>
                      </div>

                      <p className="text-text-tertiary text-xs mb-3">
                        <span className="text-text-muted">Motivo:</span> {result.debug.timeCoracaoDebug.motivo}
                      </p>

                      {/* Ranking Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border-primary">
                              <th className="text-left py-1 px-2 text-text-muted">#</th>
                              <th className="text-left py-1 px-2 text-text-muted">
                                {result.debug.timeCoracaoDebug.tipo === 'TIME_CORACAO' ? 'Time' : 'Mês'}
                              </th>
                              <th className="text-left py-1 px-2 text-text-muted">Freq</th>
                              <th className="text-left py-1 px-2 text-text-muted">%</th>
                              <th className="text-left py-1 px-2 text-text-muted">Atraso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.debug.timeCoracaoDebug.ranking.slice(0, 10).map((item, i) => (
                              <tr key={i} className={`border-b border-border-primary/50 ${item.nome === result.debug?.timeCoracaoDebug?.sugestao ? 'bg-green-900/20' : ''}`}>
                                <td className="py-1 px-2 text-text-muted">{i + 1}</td>
                                <td className="py-1 px-2 text-text-primary truncate max-w-[150px]" title={item.nome}>
                                  {item.nome === result.debug?.timeCoracaoDebug?.sugestao && '✓ '}
                                  {item.nome}
                                </td>
                                <td className="py-1 px-2 text-text-secondary">{item.frequencia}</td>
                                <td className="py-1 px-2 text-text-secondary">{item.percentual.toFixed(1)}%</td>
                                <td className="py-1 px-2 text-purple-400">{item.atraso}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pesos (Top 20) */}
                  {result.debug.pesosFinais && Object.keys(result.debug.pesosFinais).length > 0 && (
                    <div className="bg-bg-secondary rounded-lg p-4">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">⚖️ Pesos por Número (Top 20)</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.debug.pesosFinais)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 20)
                          .map(([num, peso]) => (
                            <div key={num} className="bg-surface-primary rounded px-2 py-1 text-xs">
                              <span className="text-text-primary font-bold">{num.toString().padStart(2, '0')}</span>
                              <span className="text-text-tertiary ml-1">({typeof peso === 'number' ? peso.toFixed(2) : peso})</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Critério */}
                  {result.debug.criteriosUsados && (
                    <div className="bg-bg-secondary rounded-lg p-3">
                      <h4 className="text-xs font-medium text-text-tertiary mb-1">💡 Critério Utilizado</h4>
                      <p className="text-sm text-text-secondary">{result.debug.criteriosUsados}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Histórico de Jogos */}
      <JogosHistorico key={historicoKey} tipo={tipo} />
    </div>
  );
}
