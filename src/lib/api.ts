import logger from './logger'
import metrics from './metrics'
export { LOTERIAS, LOTERIA_CONFIG } from './loterias'
export type { TipoLoteria, LoteriaConfig } from './loterias'
import type { TipoLoteria } from './loterias'

// API calls go through Next.js rewrites (see next.config.ts)
// This makes all API calls relative, avoiding CORS and exposing the backend
const API_BASE = '';
const DEFAULT_TIMEOUT_MS = 30000;

export interface GanhadorInfo {
  uf: string;
  cidade: string;
  quantidade: number;
  canal: string | null;
}

export interface TimeCoracaoInfo {
  tipoInfo: 'TIME_CORACAO' | 'MES_SORTE';
  valorAtual: string | null;
  maisFrequente: string | null;
  menosFrequente: string | null;
  maisAtrasado: string | null;
  atrasoMaisAtrasado: number;
  top5: string[];
}

export interface DashboardResponse {
  tipo: string;
  nomeLoteria: string;
  resumo: {
    totalConcursos: number;
    primeiroSorteio: string | null;
    ultimoSorteio: string | null;
    diasSemSorteio: number;
    maiorPremio: number;
    concursoMaiorPremio: number;
    mediaPremioFaixaPrincipal: number;
  };
  ultimoConcurso: {
    numero: number;
    data: string;
    dezenas: number[];
    dezenasSegundoSorteio: number[] | null;
    acumulou: boolean;
    valorAcumulado: number;
    ganhadoresFaixaPrincipal: number;
    premioFaixaPrincipal: number;
    ganhadores: GanhadorInfo[];
  } | null;
  numerosQuentes: number[];
  numerosFrios: number[];
  numerosAtrasados: number[];
  padroes: {
    mediaPares: number;
    mediaImpares: number;
    mediaPrimos: number;
    somaMedia: number;
    distribuicaoFaixas: Record<string, number>;
    maiorSequenciaHistorica: number;
    mediaBaixos: number;
    mediaAltos: number;
  } | null;
  proximoConcurso: {
    numero: number;
    dataEstimada: string;
    premioEstimado: number;
    acumulado: boolean;
  } | null;
  timeCoracaoInfo: TimeCoracaoInfo | null;
  ultimoConcursoComGanhador: {
    numero: number;
    data: string;
    dezenas: number[];
    dezenasSegundoSorteio: number[] | null;
    totalGanhadores: number;
    premioPorGanhador: number;
    premioTotal: number;
    ganhadores: GanhadorInfo[];
    concursosDesdeUltimoGanhador: number;
  } | null;
}

export interface ItemFrequencia {
  nome: string;
  frequencia: number;
  percentual: number;
  atrasoAtual: number;
  ultimaAparicao: string | null;
}

export interface TimeCoracaoMesSorteResponse {
  tipo: string;
  nomeLoteria: string;
  tipoAnalise: 'TIME_CORACAO' | 'MES_SORTE';
  totalConcursosAnalisados: number;
  maisFrequente: ItemFrequencia | null;
  menosFrequente: ItemFrequencia | null;
  frequenciaCompleta: ItemFrequencia[];
  ultimoSorteio: {
    numeroConcurso: number;
    data: string | null;
    timeOuMes: string;
  } | null;
}

export interface AnaliseNumeroResponse {
  numero: number;
  loteria: string;
  estatisticas: {
    frequencia: number;
    percentualAparicoes: number;
    atrasoAtual: number;
    maiorAtraso: number;
    mediaAtraso: number;
    primeiraAparicao: string | null;
    ultimaAparicao: string | null;
  };
  ultimasCincoAparicoes: number[];
  numerosCompanheiros: number[];
  tendencia: {
    status: string;
    recomendacao: string;
    scoreTendencia: number;
  };
}

export interface Estrategia {
  codigo: string;
  nome: string;
  descricao: string;
}

export interface GerarJogoResponse {
  tipoLoteria: string;
  jogos: number[][];
  estrategia: string;
  geradoEm: string;
  debug?: DebugInfo;
  timeSugerido?: string | null;
  mesSugerido?: string | null;
  timesSugeridos?: string[] | null;
  mesesSugeridos?: string[] | null;
  quantidadeDezenas?: number | null;
}

export interface TimeCoracaoDebug {
  tipo: 'TIME_CORACAO' | 'MES_SORTE';
  estrategiaUsada: string;
  sugestao: string;
  motivo: string;
  frequenciaSugestao: number;
  percentualSugestao: number;
  atrasoSugestao: number;
  ranking: {
    nome: string;
    frequencia: number;
    percentual: number;
    atraso: number;
  }[];
}

export interface DebugInfo {
  etapas: string[];
  pesosFinais: Record<number, number>;
  frequencias: Record<number, number>;
  atrasos: Record<number, number>;
  numerosQuentes: number[];
  numerosFrios: number[];
  numerosAtrasados: number[];
  criteriosUsados: string;
  timesTop5?: string[];
  mesesTop5?: string[];
  timeCoracaoDebug?: TimeCoracaoDebug | null;
}

export interface GerarJogoRequest {
  quantidadeNumeros?: number;
  quantidadeJogos?: number;
  usarNumerosQuentes?: boolean;
  usarNumerosFrios?: boolean;
  usarNumerosAtrasados?: boolean;
  balancearParesImpares?: boolean;
  evitarSequenciais?: boolean;
  numerosObrigatorios?: number[];
  numerosExcluidos?: number[];
  sugerirTime?: string;
  sugerirMes?: string;
  quantidadeTrevos?: number;
}

export interface SyncResponse {
  tipo: string;
  sincronizados: number;
  mensagem: string;
  sucesso?: boolean;
  rateLimited?: boolean;
  remainingSeconds?: number;
  cooldownSeconds?: number;
}

export interface SyncAllResponse {
  resultados: Record<string, { loteria: string; sincronizados: number; sucesso: boolean; mensagem: string }>;
  totalSincronizados: number;
}

export interface SyncStatusResponse {
  allowed: boolean;
  remainingSeconds: number;
  cooldownSeconds: number;
  lastSync: string;
}

export interface ConcursosEspeciaisResponse {
  loteriasComEspecial: LoteriaEspecialInfo[];
  totalAcumuladoEspeciais: number;
  proximosConcursosEspeciais: ProximoConcursoEspecialInfo[];
}

export interface LoteriaEspecialInfo {
  tipo: string;
  nome: string;
  cor: string;
  indicadorConcursoEspecial: number | null;
  numeroConcursoFinalEspecial: number | null;
  valorAcumuladoConcursoEspecial: number | null;
  valorAcumuladoConcurso05: number | null;
  nomeEspecial: string | null;
  ultimoConcurso: UltimoConcursoEspecialInfo;
}

export interface UltimoConcursoEspecialInfo {
  numero: number;
  data: string | null;
  dezenas: number[];
  dezenasOrdemSorteio: number[] | null;
  dezenasSegundoSorteio: number[] | null;
  valorArrecadado: number | null;
  valorEstimadoProximo: number | null;
  localSorteio: string | null;
  municipioUFSorteio: string | null;
  valorTotalPremioFaixaUm: number | null;
  valorSaldoReservaGarantidora: number | null;
}

export interface ProximoConcursoEspecialInfo {
  tipoLoteria: string;
  nomeLoteria: string;
  nomeEspecial: string | null;
  numeroConcursoFinalEspecial: number;
  concursosFaltando: number;
  valorAcumulado: number | null;
  dataEstimada: string | null;
}

export interface OrdemSorteioAnalise {
  tipoLoteria: string;
  nomeLoteria: string;
  totalConcursosAnalisados: number;
  primeiraBola: NumeroOrdemInfo[];
  ultimaBola: NumeroOrdemInfo[];
  frequenciaPorNumero: Record<number, PosicaoFrequencia[]>;
  mediaOrdem: NumeroOrdemInfo[];
}

export interface NumeroOrdemInfo {
  numero: number;
  frequencia: number;
  percentual: number;
}

export interface PosicaoFrequencia {
  posicao: number;
  frequencia: number;
  percentual: number;
}

export interface FinanceiroAnalise {
  tipoLoteria: string;
  nomeLoteria: string;
  resumo: ResumoFinanceiro;
  evolucaoMensal: DadosMensais[];
  ultimosConcursos: DadosConcurso[];
}

export interface ResumoFinanceiro {
  totalArrecadado: number;
  totalPremiosPagos: number;
  maiorArrecadacao: number;
  concursoMaiorArrecadacao: number;
  mediaArrecadacao: number;
  mediaPremioFaixaUm: number;
  percentualRetornoPremios: number;
  saldoReservaAtual: number;
}

export interface DadosMensais {
  ano: number;
  mes: number;
  mesAno: string;
  totalArrecadado: number;
  totalPremios: number;
  quantidadeConcursos: number;
  roi: number;
}

export interface DadosConcurso {
  numero: number;
  data: string | null;
  arrecadado: number | null;
  premioFaixaUm: number | null;
  estimadoProximo: number | null;
  ganhadores: number;
}

export interface DuplaSenaAnalise {
  totalConcursosAnalisados: number;
  comparacao: ComparacaoSorteios;
  numerosQuentesPrimeiroSorteio: number[];
  numerosQuentesSegundoSorteio: number[];
  numerosQuentesAmbos: number[];
  numerosExclusivosPrimeiro: number[];
  numerosExclusivosSegundo: number[];
  ultimosConcursos: ConcursoDuplaSena[];
  coincidencias: EstatisticasCoincidencia;
}

export interface ComparacaoSorteios {
  frequenciaPrimeiroSorteio: Record<number, number>;
  frequenciaSegundoSorteio: Record<number, number>;
  correlacao: number;
  mediaCoincidenciasPorConcurso: number;
}

export interface ConcursoDuplaSena {
  numero: number;
  data: string | null;
  dezenasPrimeiroSorteio: number[];
  dezenasSegundoSorteio: number[];
  coincidencias: number;
  premioFaixaUm: number | null;
  ganhadoresPrimeiro: number;
  ganhadoresSegundo: number;
}

export interface EstatisticasCoincidencia {
  maxCoincidencias: number;
  minCoincidencias: number;
  mediaCoincidencias: number;
  distribuicaoCoincidencias: Record<number, number>;
}

export interface NumeroTendencia {
  numero: number;
  frequenciaTotal: number;
  frequenciaRecente: number;
  taxaCrescimento: number;
  atrasoAtual: number;
  tendencia: 'QUENTE' | 'FRIO' | 'EMERGENTE' | 'ATRASADO' | 'ESTAVEL';
}

export interface PadraoVencedor {
  padrao: string;
  descricao: string;
  ocorrencias: number;
  percentual: number;
  exemploConcursos: number[];
}

export interface TendenciaResponse {
  tipo: string;
  nomeLoteria: string;
  totalConcursosAnalisados: number;
  tendenciasQuentes: NumeroTendencia[];
  tendenciasFrias: NumeroTendencia[];
  tendenciasEmergentes: NumeroTendencia[];
  mediasHistoricas: Record<string, number>;
  padroesVencedores: PadraoVencedor[];
}

export interface HistoricoMensal {
  ano: number;
  mes: number;
  frequenciaMensal: Record<number, number>;
  maisFrequentes: number[];
  menosFrequentes: number[];
}

export interface ConferirApostaResponse {
  tipoLoteria: string;
  numerosApostados: number[];
  resumo: {
    totalConcursosAnalisados: number;
    vezesPremiado: number;
    percentualPremiado: number;
    totalPremioHistorico: number;
    maiorAcertos: number;
    concursoMaiorAcertos: number;
  };
  concursosPremiados: {
    numeroConcurso: number;
    data: string | null;
    dezenasSorteadas: number[];
    acertos: number[];
    quantidadeAcertos: number;
    faixa: string;
    valorPremio: number;
  }[];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    message?: string
  ) {
    super(message || `API error: ${status} on ${endpoint}`);
    this.name = 'ApiError';
  }
}

async function postApi<T>(endpoint: string, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  const startTime = performance.now()
  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  
  try {
    const fetchOpts: RequestInit = { method: 'POST', cache: 'no-store', signal: combinedSignal };
    const res = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
    const duration = performance.now() - startTime
    
    metrics.timing('api_request', duration, { endpoint, method: 'POST', status: res.status.toString() })
    metrics.increment('api_requests_total', { endpoint, method: 'POST', status: res.status.toString() })
    
    if (!res.ok) {
      logger.error({ endpoint, status: res.status }, 'API POST request failed')
      throw new ApiError(res.status, endpoint);
    }
    
    logger.debug({ endpoint, duration }, 'API POST request completed')
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new ApiError(res.status, endpoint, 'Unexpected response content-type')
    }
    return res.json();
  } catch (error) {
    const duration = performance.now() - startTime
    metrics.increment('api_requests_errors', { endpoint, method: 'POST' })
    logger.error({ endpoint, error, duration }, 'API POST request error')
    throw error
  }
}

const RETRYABLE_STATUSES = [502, 503, 429]
const MAX_RETRIES = 2

async function fetchApi<T>(endpoint: string, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  const startTime = performance.now()
  let lastError: unknown
  const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
      const fetchOpts: RequestInit = { cache: 'no-store', signal: combinedSignal };
      const res = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
      const duration = performance.now() - startTime

      metrics.timing('api_request', duration, { endpoint, status: res.status.toString() })
      metrics.increment('api_requests_total', { endpoint, status: res.status.toString() })

      if (!res.ok) {
        if (attempt < MAX_RETRIES && RETRYABLE_STATUSES.includes(res.status)) {
          logger.warn({ endpoint, status: res.status, attempt }, 'Retryable API error, retrying')
          lastError = new ApiError(res.status, endpoint)
          continue
        }
        logger.error({ endpoint, status: res.status }, 'API request failed')
        throw new ApiError(res.status, endpoint);
      }

      logger.debug({ endpoint, duration }, 'API request completed')
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new ApiError(res.status, endpoint, 'Unexpected response content-type')
      }
      return res.json();
    } catch (error) {
      lastError = error
      if (error instanceof ApiError && attempt < MAX_RETRIES && RETRYABLE_STATUSES.includes(error.status)) {
        continue
      }
      const duration = performance.now() - startTime
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      metrics.increment('api_requests_errors', { endpoint })
      logger.error({ endpoint, error, duration }, 'API request error')
      throw error
    }
  }

  throw lastError
}

export const api = {
  getDashboard: (tipo: TipoLoteria, { signal }: { signal?: AbortSignal } = {}) => 
    fetchApi<DashboardResponse>(`/api/dashboard/${tipo}`, { signal }),
  
  getRankingNumeros: (tipo: TipoLoteria) =>
    fetchApi<AnaliseNumeroResponse[]>(`/api/dashboard/${tipo}/numeros/ranking`),
  
  getEstrategias: ({ signal }: { signal?: AbortSignal } = {}) =>
    fetchApi<Estrategia[]>(`/api/estatisticas/estrategias`, { signal }),
  
  gerarJogosEstrategico: (tipo: TipoLoteria, estrategia: string, quantidade: number, quantidadeNumeros?: number, debug: boolean = false, quantidadeTrevos?: number) => {
    const params = new URLSearchParams();
    params.append('estrategia', estrategia);
    params.append('quantidade', quantidade.toString());
    if (quantidadeNumeros) params.append('quantidadeNumeros', quantidadeNumeros.toString());
    if (quantidadeTrevos) params.append('quantidadeTrevos', quantidadeTrevos.toString());
    params.append('debug', debug.toString());
    return fetchApi<GerarJogoResponse>(`/api/estatisticas/${tipo}/gerar-jogos-estrategico?${params.toString()}`);
  },
  
  gerarJogosPersonalizado: (tipo: TipoLoteria, request: GerarJogoRequest, debug: boolean = false) => {
    const params = new URLSearchParams();
    if (request.quantidadeNumeros) params.append('quantidadeNumeros', request.quantidadeNumeros.toString());
    if (request.quantidadeJogos) params.append('quantidadeJogos', request.quantidadeJogos.toString());
    if (request.usarNumerosQuentes !== undefined) params.append('usarNumerosQuentes', request.usarNumerosQuentes.toString());
    if (request.usarNumerosFrios !== undefined) params.append('usarNumerosFrios', request.usarNumerosFrios.toString());
    if (request.usarNumerosAtrasados !== undefined) params.append('usarNumerosAtrasados', request.usarNumerosAtrasados.toString());
    if (request.balancearParesImpares !== undefined) params.append('balancearParesImpares', request.balancearParesImpares.toString());
    if (request.evitarSequenciais !== undefined) params.append('evitarSequenciais', request.evitarSequenciais.toString());
    if (request.numerosObrigatorios?.length) params.append('numerosObrigatorios', request.numerosObrigatorios.join(','));
    if (request.numerosExcluidos?.length) params.append('numerosExcluidos', request.numerosExcluidos.join(','));
    if (request.sugerirTime) params.append('sugerirTime', request.sugerirTime);
    if (request.sugerirMes) params.append('sugerirMes', request.sugerirMes);
    if (request.quantidadeTrevos) params.append('quantidadeTrevos', request.quantidadeTrevos.toString());
    params.append('debug', debug.toString());
    return fetchApi<GerarJogoResponse>(`/api/estatisticas/${tipo}/gerar-jogos?${params.toString()}`);
  },
  
  conferirAposta: (tipo: TipoLoteria, numeros: number[]) =>
    fetchApi<ConferirApostaResponse>(`/api/dashboard/${tipo}/conferir?numeros=${numeros.join(',')}`),
  
  syncLoteria: (tipo: TipoLoteria) =>
    postApi<SyncResponse>(`/api/concursos/${tipo}/sync-ultimo`),
  
  syncTodasLoterias: () =>
    postApi<SyncAllResponse>(`/api/concursos/sync-ultimos`),

  getSyncStatus: () =>
    fetchApi<SyncStatusResponse>(`/api/concursos/sync-status`),

  getEspeciais: () =>
    fetchApi<ConcursosEspeciaisResponse>(`/api/dashboard/especiais`),

  getOrdemSorteio: (tipo: TipoLoteria) =>
    fetchApi<OrdemSorteioAnalise>(`/api/analise/${tipo}/ordem-sorteio`),

  getFinanceiro: (tipo: TipoLoteria, dataInicio?: string, dataFim?: string) => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const qs = params.toString();
    return fetchApi<FinanceiroAnalise>(`/api/analise/${tipo}/financeiro${qs ? `?${qs}` : ''}`);
  },

  getAcumulado: (tipo: TipoLoteria) =>
    fetchApi<{
      tipoLoteria: string;
      nomeLoteria: string;
      acumulado: boolean;
      valorAcumulado: number;
      valorEstimadoProximo: number;
      concursosAcumulados: number;
      ultimoConcurso: number;
      dataUltimoConcurso: string | null;
      dataEstimadaProximo: string | null;
    }>(`/api/dashboard/${tipo}/acumulado`),

  getDuplaSena: () =>
    fetchApi<DuplaSenaAnalise>(`/api/analise/dupla-sena`),

  getTimeCoracao: (tipo: TipoLoteria) =>
    fetchApi<TimeCoracaoMesSorteResponse>(`/api/analise/${tipo}/time-coracao`),

  getSugestaoTimeCoracao: (tipo: TipoLoteria, estrategia: string) =>
    fetchApi<{ sugestao: string; estrategia: string }>(`/api/analise/${tipo}/time-coracao/sugestao?estrategia=${estrategia}`),

  getTendencias: (tipo: TipoLoteria) =>
    fetchApi<TendenciaResponse>(`/api/analise/${tipo}/tendencias`),

  getHistoricoMensal: (tipo: TipoLoteria) =>
    fetchApi<HistoricoMensal[]>(`/api/analise/${tipo}/historico-mensal`),

  getGanhadoresPorUF: (tipo: TipoLoteria) =>
    fetchApi<{
      tipoLoteria: string;
      nomeLoteria: string;
      totalConcursosAnalisados: number;
      totalGanhadores: number;
      cidadesDisponiveisDesde: string | null;
      porEstado: {
        uf: string;
        totalGanhadores: number;
        totalConcursos: number;
        cidades: { cidade: string; totalGanhadores: number }[];
      }[];
    }>(`/api/dashboard/${tipo}/ganhadores-por-uf`),
};
