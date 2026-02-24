'use client';

import { useState, useEffect } from 'react';
import { api, TipoLoteria, Estrategia, GerarJogoResponse, GerarJogoRequest, LOTERIAS } from '@/lib/api';
import { writeToClipboard, downloadFile, formatGameLine } from '@/lib/game-export';
import logger from '@/lib/logger';
import { Dices, Loader2, Copy, Check, Calendar, CalendarDays, FileText, ClipboardList, Zap, Settings, Heart, ChevronDown, ChevronUp, Brain, Flame, Snowflake, Scale, Ban, Clover, Lightbulb, X, Clock } from 'lucide-react';
import clsx from 'clsx';

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

const DIAS_SORTEIO: Record<TipoLoteria, DayOfWeek[]> = {
  mega_sena: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
  lotofacil: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  quina: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  lotomania: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  timemania: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
  dupla_sena: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  dia_de_sorte: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
  super_sete: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  mais_milionaria: ['WEDNESDAY', 'SATURDAY'],
};

const DIAS_SEMANA: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'MONDAY', label: 'Segunda', short: 'Seg' },
  { key: 'TUESDAY', label: 'Terça', short: 'Ter' },
  { key: 'WEDNESDAY', label: 'Quarta', short: 'Qua' },
  { key: 'THURSDAY', label: 'Quinta', short: 'Qui' },
  { key: 'FRIDAY', label: 'Sexta', short: 'Sex' },
  { key: 'SATURDAY', label: 'Sábado', short: 'Sáb' },
];

function getTodayDayOfWeek(): DayOfWeek | null {
  const day = new Date().getDay();
  const mapping: Record<number, DayOfWeek> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
  };
  return mapping[day] || null;
}

function getLoteriasByDay(day: DayOfWeek): TipoLoteria[] {
  return LOTERIAS
    .map(l => l.value)
    .filter(tipo => DIAS_SORTEIO[tipo]?.includes(day));
}

type GeneratorMode = 'estrategico' | 'personalizado';

interface GeneratedResult {
  tipo: TipoLoteria;
  response: GerarJogoResponse;
}

export function MultiGameGenerator() {
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [selectedLoterias, setSelectedLoterias] = useState<TipoLoteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'TODAY' | null>(null);

  // Configuração global
  const [mode, setMode] = useState<GeneratorMode>('estrategico');
  const [globalEstrategia, setGlobalEstrategia] = useState('ALEATORIO');
  const [quantidadePorLoteria, setQuantidadePorLoteria] = useState(1);

  // Opções personalizadas
  const [usarNumerosQuentes, setUsarNumerosQuentes] = useState(false);
  const [usarNumerosFrios, setUsarNumerosFrios] = useState(false);
  const [usarNumerosAtrasados, setUsarNumerosAtrasados] = useState(false);
  const [balancearParesImpares, setBalancearParesImpares] = useState(false);
  const [evitarSequenciais, setEvitarSequenciais] = useState(false);
  const [showPersonalizadoOptions, setShowPersonalizadoOptions] = useState(true);
  
  // Debug
  const [showDebug, setShowDebug] = useState(false);
  const [debugModalData, setDebugModalData] = useState<GeneratedResult | null>(null);

  useEffect(() => {
    api.getEstrategias().then(setEstrategias).catch(err => logger.error({ err }, 'Failed to load strategies'));
    
    // Seleciona o dia de hoje e as loterias correspondentes ao montar
    const today = getTodayDayOfWeek();
    if (today) {
      const loterias = getLoteriasByDay(today);
      setSelectedLoterias(loterias);
      setSelectedDay('TODAY');
    }
  }, []);

  const toggleLoteria = (tipo: TipoLoteria) => {
    setSelectedLoterias(prev => {
      if (prev.includes(tipo)) {
        return prev.filter(l => l !== tipo);
      }
      return [...prev, tipo];
    });
    setSelectedDay(null);
  };

  const selectByDay = (day: DayOfWeek) => {
    const loterias = getLoteriasByDay(day);
    setSelectedLoterias(loterias);
    setSelectedDay(day);
  };

  const selectToday = () => {
    const today = getTodayDayOfWeek();
    if (today) {
      selectByDay(today);
      setSelectedDay('TODAY');
    }
  };

  const handleGenerate = async () => {
    if (selectedLoterias.length === 0) return;

    setLoading(true);
    setResults([]);
    setDebugModalData(null);

    try {
      const promises = selectedLoterias.map(async tipo => {
        let response: GerarJogoResponse;
        
        if (mode === 'estrategico') {
          response = await api.gerarJogosEstrategico(
            tipo,
            globalEstrategia,
            quantidadePorLoteria,
            undefined,
            showDebug
          );
        } else {
          const request: GerarJogoRequest = {
            quantidadeJogos: quantidadePorLoteria,
            usarNumerosQuentes: usarNumerosQuentes || undefined,
            usarNumerosFrios: usarNumerosFrios || undefined,
            usarNumerosAtrasados: usarNumerosAtrasados || undefined,
            balancearParesImpares: balancearParesImpares || undefined,
            evitarSequenciais: evitarSequenciais || undefined,
          };
          response = await api.gerarJogosPersonalizado(tipo, request, showDebug);
        }
        
        return { tipo, response };
      });

      const settledResults = await Promise.allSettled(promises);
      const successful = settledResults
        .filter((r): r is PromiseFulfilledResult<{ tipo: typeof selectedLoterias[number]; response: GerarJogoResponse }> => r.status === 'fulfilled')
        .map(r => r.value);
      const failed = settledResults.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        logger.warn({ failedCount: failed.length }, 'Some lottery generations failed');
      }
      setResults(successful);
    } catch (error) {
      logger.error({ err: error }, 'Failed to generate games');
    } finally {
      setLoading(false);
    }
  };
  
  

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await writeToClipboard(text);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      logger.warn({ err }, 'Clipboard copy failed');
    }
  };

  const copyAllToClipboard = async () => {
    if (results.length === 0) return;

    let text = '';
    results.forEach(result => {
      const loteriaInfo = LOTERIAS.find(l => l.value === result.tipo);
      text += `\n=== ${loteriaInfo?.label} ===\n`;
      text += `Estratégia: ${result.response.estrategia}\n`;
      result.response.jogos.forEach((jogo, i) => {
        text += formatGameLine(result.response, jogo, i) + '\n';
      });
    });

    try {
      await writeToClipboard(text.trim());
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      logger.warn({ err }, 'Clipboard copy failed');
    }
  };

  const downloadAllTXT = () => {
    if (results.length === 0) return;

    let text = `Jogos Gerados - Múltiplas Loterias\n`;
    text += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
    text += `${'='.repeat(50)}\n`;

    results.forEach(result => {
      const loteriaInfo = LOTERIAS.find(l => l.value === result.tipo);
      text += `\n\n▶ ${loteriaInfo?.label}\n`;
      text += `Estratégia: ${result.response.estrategia}\n`;
      text += `${'-'.repeat(30)}\n`;
      result.response.jogos.forEach((jogo, i) => {
        text += `Jogo ${i + 1}: ${jogo.map(n => n.toString().padStart(2, '0')).join(' - ')}\n`;
      });
      if (result.response.timeSugerido) {
        text += `Time do Coração: ${result.response.timeSugerido}\n`;
      }
      if (result.response.mesSugerido) {
        text += `Mês da Sorte: ${result.response.mesSugerido}\n`;
      }
    });

    downloadFile(text, `jogos-multiplos-${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
  };

  const isLoteriaSelected = (tipo: TipoLoteria) => selectedLoterias.includes(tipo);

  const todayDay = getTodayDayOfWeek();
  const todayLabel = todayDay ? DIAS_SEMANA.find(d => d.key === todayDay)?.label : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
            <Dices className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Gerador Múltiplo</h2>
            <p className="text-text-tertiary">Gere jogos para várias loterias de uma vez</p>
          </div>
        </div>

        {/* Seleção por dia */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Selecionar por Dia do Sorteio
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectToday}
              disabled={!todayDay}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                selectedDay === 'TODAY'
                  ? 'bg-green-600 text-white'
                  : todayDay
                    ? 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                    : 'bg-surface-secondary text-text-muted cursor-not-allowed'
              )}
            >
              <Calendar className="w-4 h-4" />
              Hoje {todayLabel && `(${todayLabel})`}
            </button>
            {DIAS_SEMANA.map(dia => (
              <button
                key={dia.key}
                onClick={() => selectByDay(dia.key)}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  selectedDay === dia.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary'
                )}
              >
                {dia.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seleção manual de loterias */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-secondary">
            Selecionar Loterias ({selectedLoterias.length} selecionadas)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {LOTERIAS.map(loteria => (
              <button
                key={loteria.value}
                onClick={() => toggleLoteria(loteria.value)}
                className={clsx(
                  'px-3 py-2 rounded-lg font-medium text-sm transition-all border-2',
                  isLoteriaSelected(loteria.value)
                    ? 'text-white border-transparent'
                    : 'bg-surface-secondary text-text-tertiary border-transparent hover:border-current'
                )}
                style={
                  isLoteriaSelected(loteria.value)
                    ? { backgroundColor: loteria.color }
                    : {}
                }
              >
                {loteria.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Configuração Global */}
      <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuração (aplicada a todas as loterias)
        </h3>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-tertiary text-sm mb-2">Estratégia</label>
              <select
                value={globalEstrategia}
                onChange={(e) => setGlobalEstrategia(e.target.value)}
                className="w-full bg-surface-secondary text-text-primary rounded-lg px-4 py-3 border border-border-secondary focus:border-blue-500 focus:outline-none"
              >
                {estrategias.map((e) => (
                  <option key={e.codigo} value={e.codigo}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-text-tertiary text-sm mb-2">Quantidade por Loteria</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantidadePorLoteria}
                onChange={(e) => setQuantidadePorLoteria(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-full bg-surface-secondary text-text-primary rounded-lg px-4 py-3 border border-border-secondary focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-text-tertiary text-sm mb-2">Quantidade por Loteria</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantidadePorLoteria}
                onChange={(e) => setQuantidadePorLoteria(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-full md:w-48 bg-surface-secondary text-text-primary rounded-lg px-4 py-3 border border-border-secondary focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowPersonalizadoOptions(!showPersonalizadoOptions)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {showPersonalizadoOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Opções de Geração
            </button>

            {showPersonalizadoOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-surface-secondary rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarNumerosQuentes}
                    onChange={(e) => setUsarNumerosQuentes(e.target.checked)}
                    className="w-5 h-5 rounded accent-red-500"
                  />
                  <span className="text-text-primary"><Flame className="w-4 h-4 inline-block" /> Priorizar Quentes</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarNumerosFrios}
                    onChange={(e) => setUsarNumerosFrios(e.target.checked)}
                    className="w-5 h-5 rounded accent-blue-500"
                  />
                  <span className="text-text-primary"><Snowflake className="w-4 h-4 inline-block" /> Incluir Frios</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarNumerosAtrasados}
                    onChange={(e) => setUsarNumerosAtrasados(e.target.checked)}
                    className="w-5 h-5 rounded accent-purple-500"
                  />
                  <span className="text-text-primary"><Clock className="w-4 h-4 inline-block" /> Incluir Atrasados</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={balancearParesImpares}
                    onChange={(e) => setBalancearParesImpares(e.target.checked)}
                    className="w-5 h-5 rounded accent-green-500"
                  />
                  <span className="text-text-primary"><Scale className="w-4 h-4 inline-block" /> Balancear Pares/Ímpares</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evitarSequenciais}
                    onChange={(e) => setEvitarSequenciais(e.target.checked)}
                    className="w-5 h-5 rounded accent-yellow-500"
                  />
                  <span className="text-text-primary"><Ban className="w-4 h-4 inline-block" /> Evitar Sequenciais</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Mostrar Raciocínio */}
        <div className="mt-4 pt-4 border-t border-border-secondary">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="w-5 h-5 rounded accent-purple-500"
            />
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-text-primary">Mostrar Raciocínio da Geração</span>
          </label>
        </div>

        {/* Botão gerar */}
        <button
          onClick={handleGenerate}
          disabled={loading || selectedLoterias.length === 0}
          className={clsx(
            'w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all',
            selectedLoterias.length > 0
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
              : 'bg-surface-secondary text-text-muted cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Zap className="w-6 h-6" />
              Gerar {selectedLoterias.length * quantidadePorLoteria} Jogos ({selectedLoterias.length} loterias × {quantidadePorLoteria})
            </>
          )}
        </button>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary">Jogos Gerados</h3>
            <div className="flex gap-2">
              <button
                onClick={copyAllToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-sm text-text-primary"
              >
                {copiedAll ? <Check className="w-4 h-4 text-green-400" /> : <ClipboardList className="w-4 h-4" />}
                {copiedAll ? 'Copiado!' : 'Copiar Todos'}
              </button>
              <button
                onClick={downloadAllTXT}
                className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-sm text-text-primary"
              >
                <FileText className="w-4 h-4" />
                Baixar TXT
              </button>
            </div>
          </div>

          {(() => {
              const normalResults = results.filter(r => (r.response.jogos[0]?.length || 0) <= 20);
              const largeResults = results.filter(r => (r.response.jogos[0]?.length || 0) > 20);
              
              const renderCard = (result: GeneratedResult) => {
                const loteriaInfo = LOTERIAS.find(l => l.value === result.tipo);
                return (
                  <div
                    key={result.tipo}
                    className="bg-surface-secondary rounded-xl p-4 border border-border-secondary"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-primary">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: loteriaInfo?.color }}
                      />
                      <span className="font-bold text-text-primary">{loteriaInfo?.label}</span>
                      <span className="text-xs text-text-muted ml-auto truncate max-w-[150px]" title={result.response.estrategia}>
                        {result.response.estrategia}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {result.response.jogos.map((jogo, i) => {
                        const isMaisMilionaria = result.tipo === 'mais_milionaria';
                        const qtdDezenas = result.response.quantidadeDezenas ?? 6;
                        const dezenas = isMaisMilionaria ? jogo.slice(0, qtdDezenas) : jogo;
                        const trevos = isMaisMilionaria ? jogo.slice(qtdDezenas) : [];
                        const timeSugeridoJogo = result.response.timesSugeridos?.[i] || (i === 0 ? result.response.timeSugerido : null);
                        const mesSugeridoJogo = result.response.mesesSugeridos?.[i] || (i === 0 ? result.response.mesSugerido : null);
                        
                        return (
                          <div key={i} className="flex flex-col gap-1 py-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="text-xs text-text-muted w-6 shrink-0 pt-1">#{i + 1}</span>
                                <div className="flex gap-1 flex-wrap items-center">
                                  {dezenas.map((num, j) => (
                                    <span
                                      key={j}
                                      className="rounded-full font-bold flex items-center justify-center text-white shadow-sm w-7 h-7 text-xs"
                                      style={{ backgroundColor: loteriaInfo?.color }}
                                    >
                                      {num.toString().padStart(2, '0')}
                                    </span>
                                  ))}
                                  
                                  {isMaisMilionaria && trevos.length > 0 && (
                                    <>
                                      <span className="text-text-muted mx-1">+</span>
                                      <div className="flex items-center gap-1 bg-yellow-600/20 px-2 py-1 rounded-lg border border-yellow-600/50">
                                        <Clover className="w-4 h-4 inline-block text-yellow-400 mr-1" />
                                        {trevos.map((num, j) => (
                                          <span
                                            key={j}
                                            className="w-6 h-6 rounded-full bg-yellow-600 text-white font-bold text-xs flex items-center justify-center"
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
                                onClick={() => copyToClipboard(jogo.join(', '), `${result.tipo}-${i}`)}
                                className="p-1.5 hover:bg-surface-tertiary rounded transition-colors shrink-0"
                              >
                                {copiedIndex === `${result.tipo}-${i}` ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-text-tertiary" />
                                )}
                              </button>
                            </div>
                            {/* Time/Mês por jogo */}
                            {(timeSugeridoJogo || mesSugeridoJogo) && (
                              <div className="ml-8 flex items-center gap-2 text-xs">
                                {timeSugeridoJogo && (
                                  <span className="flex items-center gap-1 text-red-400">
                                    <Heart className="w-3 h-3" />
                                    <span className="font-medium">{timeSugeridoJogo}</span>
                                  </span>
                                )}
                                {mesSugeridoJogo && (
                                  <span className="flex items-center gap-1 text-orange-400">
                                    <CalendarDays className="w-3 h-3" />
                                    <span className="font-medium">{mesSugeridoJogo}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Debug Button */}
                    {result.response.debug && (
                      <div className="mt-3 pt-3 border-t border-border-primary">
                        <button
                          onClick={() => setDebugModalData(result)}
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                        >
                          <Brain className="w-4 h-4" />
                          <span className="font-medium">Ver Raciocínio</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="space-y-4">
                  {/* Loterias normais em grid */}
                  {normalResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {normalResults.map(result => renderCard(result))}
                    </div>
                  )}
                  
                  {/* Loterias com muitos números (Lotomania) em largura total */}
                  {largeResults.length > 0 && (
                    <div className="space-y-4">
                      {largeResults.map(result => renderCard(result))}
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      )}

      {/* Debug Modal */}
      {debugModalData && debugModalData.response.debug && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setDebugModalData(null)}>
          <div 
            className="bg-bg-secondary rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-primary">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-text-primary">
                  Raciocínio - {LOTERIAS.find(l => l.value === debugModalData.tipo)?.label}
                </h3>
              </div>
              <button
                onClick={() => setDebugModalData(null)}
                className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors text-text-tertiary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-4">
              {/* Etapas */}
              {debugModalData.response.debug.etapas?.length > 0 && (
                <div className="bg-surface-primary rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-3"><ClipboardList className="w-4 h-4 inline-block" /> Etapas do Processo</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {debugModalData.response.debug.etapas.map((etapa, idx) => (
                      <li key={idx} className="text-sm text-text-tertiary">{etapa}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Números */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {debugModalData.response.debug.numerosQuentes?.length > 0 && (
                  <div className="bg-surface-primary rounded-lg p-3">
                    <h4 className="text-xs font-medium text-red-400 mb-2"><Flame className="w-4 h-4 inline-block" /> Top 10 Quentes</h4>
                    <div className="flex flex-wrap gap-1">
                      {[...debugModalData.response.debug.numerosQuentes].sort((a, b) => a - b).map(n => (
                        <span key={n} className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {debugModalData.response.debug.numerosFrios?.length > 0 && (
                  <div className="bg-surface-primary rounded-lg p-3">
                    <h4 className="text-xs font-medium text-blue-400 mb-2"><Snowflake className="w-4 h-4 inline-block" /> Top 10 Frios</h4>
                    <div className="flex flex-wrap gap-1">
                      {[...debugModalData.response.debug.numerosFrios].sort((a, b) => a - b).map(n => (
                        <span key={n} className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {debugModalData.response.debug.numerosAtrasados?.length > 0 && (
                  <div className="bg-surface-primary rounded-lg p-3">
                    <h4 className="text-xs font-medium text-purple-400 mb-2"><Clock className="w-4 h-4 inline-block" /> Top 10 Atrasados</h4>
                    <div className="flex flex-wrap gap-1">
                      {[...debugModalData.response.debug.numerosAtrasados].sort((a, b) => a - b).map(n => (
                        <span key={n} className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pesos - só mostra se houver variação (não todos 1.0) */}
              {debugModalData.response.debug.pesosFinais && (() => {
                const entries = Object.entries(debugModalData.response.debug.pesosFinais);
                const hasVariation = entries.some(([, peso]) => peso !== 1.0);
                if (!hasVariation || entries.length === 0) return null;
                
                return (
                  <div className="bg-surface-primary rounded-lg p-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2"><Scale className="w-4 h-4 inline-block" /> Pesos por Número (Top 20)</h4>
                    <div className="flex flex-wrap gap-2">
                      {entries
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 20)
                        .map(([num, peso]) => (
                          <div key={num} className="bg-surface-secondary rounded px-2 py-1 text-xs">
                            <span className="text-text-primary font-bold">{num.toString().padStart(2, '0')}</span>
                            <span className="text-text-tertiary ml-1">({typeof peso === 'number' ? peso.toFixed(2) : peso})</span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })()}

              {/* Critério */}
              {debugModalData.response.debug.criteriosUsados && (
                <div className="bg-surface-primary rounded-lg p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-2"><Lightbulb className="w-4 h-4 inline-block" /> Critério Utilizado</h4>
                  <p className="text-sm text-text-tertiary">{debugModalData.response.debug.criteriosUsados}</p>
                </div>
              )}

              {/* Time/Mês Debug */}
              {debugModalData.response.debug.timeCoracaoDebug && (
                <div className="bg-gradient-to-r from-surface-primary to-surface-secondary rounded-lg p-4 border border-border-primary">
                  <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                    {debugModalData.response.debug.timeCoracaoDebug.tipo === 'TIME_CORACAO' ? (
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-bg-secondary rounded p-2">
                      <p className="text-text-muted text-xs">Estratégia</p>
                      <p className="text-text-primary font-medium text-sm uppercase">{debugModalData.response.debug.timeCoracaoDebug.estrategiaUsada}</p>
                    </div>
                    <div className="bg-bg-secondary rounded p-2">
                      <p className="text-text-muted text-xs">Selecionado</p>
                      <p className="text-green-400 font-bold text-sm truncate">{debugModalData.response.debug.timeCoracaoDebug.sugestao}</p>
                    </div>
                    <div className="bg-bg-secondary rounded p-2">
                      <p className="text-text-muted text-xs">Frequência</p>
                      <p className="text-text-primary font-medium text-sm">
                        {debugModalData.response.debug.timeCoracaoDebug.frequenciaSugestao}x ({debugModalData.response.debug.timeCoracaoDebug.percentualSugestao.toFixed(1)}%)
                      </p>
                    </div>
                    <div className="bg-bg-secondary rounded p-2">
                      <p className="text-text-muted text-xs">Atraso</p>
                      <p className="text-purple-400 font-medium text-sm">{debugModalData.response.debug.timeCoracaoDebug.atrasoSugestao} sorteios</p>
                    </div>
                  </div>

                  <p className="text-text-tertiary text-xs">
                    <span className="text-text-muted">Motivo:</span> {debugModalData.response.debug.timeCoracaoDebug.motivo}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
