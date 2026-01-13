'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api, TipoLoteria, DashboardResponse, LOTERIAS } from '@/lib/api';
import logger from '@/lib/logger';
import { LotterySelector } from '@/components/LotterySelector';
import { Dashboard } from '@/components/Dashboard';
import { GameGenerator } from '@/components/GameGenerator';
import { BetChecker } from '@/components/BetChecker';
import { NumberRanking } from '@/components/NumberRanking';
import { EspeciaisDashboard } from '@/components/EspeciaisDashboard';
import { OrdemSorteioAnalise } from '@/components/OrdemSorteioAnalise';
import { FinanceiroAnalise } from '@/components/FinanceiroAnalise';
import { DuplaSenaAnalise } from '@/components/DuplaSenaAnalise';
import { TimeCoracaoRanking } from '@/components/TimeCoracaoRanking';
import TendenciasAnalise from '@/components/TendenciasAnalise';
import { AppHeader, Section } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { ExportTab } from '@/components/ExportTab';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LayoutDashboard, Dices, Search, BarChart2, Loader2, ListOrdered, DollarSign, Heart, TrendingUp, Download, MapPin, Calculator } from 'lucide-react';
import { MultiGameGenerator } from '@/components/MultiGameGenerator';
import { RegionalAnalysis } from '@/components/RegionalAnalysis';
import { ProbabilityCalculator } from '@/components/ProbabilityCalculator';
import clsx from 'clsx';

type Tab = 'dashboard' | 'generator' | 'checker' | 'ranking' | 'ordem' | 'financeiro' | 'timecoracao' | 'tendencias' | 'exportar' | 'regional' | 'probabilidade';

const SYNC_COOLDOWN_SECONDS = 120;

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('loterias');
  const [selectedLoteria, setSelectedLoteria] = useState<TipoLoteria>('mega_sena');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncCooldown, setSyncCooldown] = useState(0);
  const cooldownInterval = useRef<NodeJS.Timeout | null>(null);

  const loteriaInfo = useMemo(() => LOTERIAS.find(l => l.value === selectedLoteria), [selectedLoteria]);

  const startCooldownTimer = useCallback((seconds: number) => {
    if (cooldownInterval.current) {
      clearInterval(cooldownInterval.current);
    }
    setSyncCooldown(seconds);
    cooldownInterval.current = setInterval(() => {
      setSyncCooldown(prev => {
        if (prev <= 1) {
          if (cooldownInterval.current) {
            clearInterval(cooldownInterval.current);
            cooldownInterval.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    api.getSyncStatus().then(status => {
      if (!status.allowed && status.remainingSeconds > 0) {
        startCooldownTimer(status.remainingSeconds);
      }
    }).catch((err) => {
      logger.error({ err }, 'Failed to fetch sync status');
    });
    
    return () => {
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, [startCooldownTimer]);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard(selectedLoteria, { signal });
      if (!signal?.aborted) setDashboardData(data);
    } catch (err) {
      if (!signal?.aborted) {
        setError('Erro ao carregar dados. Verifique se o backend está rodando.');
        logger.error({ err }, 'Failed to load dashboard');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [selectedLoteria]);

  const syncAndLoad = useCallback(async () => {
    if (syncCooldown > 0) return;
    
    setSyncing(true);
    setError(null);
    try {
      const result = await api.syncTodasLoterias();
      startCooldownTimer(SYNC_COOLDOWN_SECONDS);
      
      if (result.totalSincronizados > 0) {
        await loadDashboard();
      }
    } catch (err) {
      setError('Erro ao sincronizar dados da Caixa.');
      logger.error({ err }, 'Failed to sync lotteries');
    } finally {
      setSyncing(false);
    }
  }, [syncCooldown, startCooldownTimer, loadDashboard]);

  const formatCooldown = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  const showTimeCoracaoTab = selectedLoteria === 'timemania' || selectedLoteria === 'dia_de_sorte';
  const timeCoracaoLabel = selectedLoteria === 'timemania' ? 'Times' : 'Meses';

  const baseTabs: { id: Tab; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tendencias', label: 'Tendências', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'ordem', label: 'Ordem Sorteio', icon: <ListOrdered className="w-5 h-5" /> },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'generator', label: 'Gerador', icon: <Dices className="w-5 h-5" /> },
    { id: 'checker', label: 'Conferir', icon: <Search className="w-5 h-5" /> },
    { id: 'ranking', label: 'Ranking', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'regional', label: 'Regional', icon: <MapPin className="w-5 h-5" /> },
    { id: 'probabilidade', label: 'Probabilidades', icon: <Calculator className="w-5 h-5" /> },
    { id: 'exportar', label: 'Exportar', icon: <Download className="w-5 h-5" /> },
  ], []);

  const tabs = showTimeCoracaoTab 
    ? [...baseTabs, { id: 'timecoracao' as Tab, label: timeCoracaoLabel, icon: <Heart className="w-5 h-5" /> }]
    : baseTabs;

  return (
    <main className="min-h-screen bg-bg-primary">
      <AppHeader
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        syncing={syncing}
        loading={loading}
        syncCooldown={syncCooldown}
        formatCooldown={formatCooldown}
        onSync={syncAndLoad}
        onRefresh={loadDashboard}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeSection === 'especiais' && <ErrorBoundary name="Concursos Especiais"><EspeciaisDashboard /></ErrorBoundary>}
        {activeSection === 'dupla-sena' && <ErrorBoundary name="Dupla Sena"><DuplaSenaAnalise /></ErrorBoundary>}
        {activeSection === 'multi-gerador' && <ErrorBoundary name="Multi Gerador"><MultiGameGenerator /></ErrorBoundary>}
        
        {activeSection === 'loterias' && (
          <>
            <div className="mb-6">
              <LotterySelector selected={selectedLoteria} onSelect={setSelectedLoteria} />
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist" aria-label="Seções de análise">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'text-white shadow-lg'
                      : 'bg-surface-primary text-text-tertiary hover:bg-surface-secondary hover:text-text-primary'
                  )}
                  style={activeTab === tab.id ? { backgroundColor: loteriaInfo?.color } : {}}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {error && (
              <div role="alert" className="bg-red-900/50 border border-red-700 text-red-400 rounded-xl p-4 mb-6">
                <p className="font-medium">Erro de conexão</p>
                <p className="text-sm">{error}</p>
                <button onClick={() => loadDashboard()} className="mt-2 text-sm underline hover:no-underline">
                  Tentar novamente
                </button>
              </div>
            )}

            {loading && activeTab === 'dashboard' && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
              </div>
            )}

            {!loading && !error && (
              <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-label={tabs.find(t => t.id === activeTab)?.label}>
                {activeTab === 'dashboard' && dashboardData && (
                  <ErrorBoundary name="Dashboard">
                    <Dashboard data={dashboardData} tipo={selectedLoteria} />
                  </ErrorBoundary>
                )}
                {activeTab === 'tendencias' && <ErrorBoundary name="Tendências"><TendenciasAnalise loteria={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'ordem' && <ErrorBoundary name="Ordem Sorteio"><OrdemSorteioAnalise tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'financeiro' && <ErrorBoundary name="Financeiro"><FinanceiroAnalise tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'generator' && <ErrorBoundary name="Gerador"><GameGenerator tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'checker' && <ErrorBoundary name="Conferir"><BetChecker tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'ranking' && <ErrorBoundary name="Ranking"><NumberRanking tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'regional' && <ErrorBoundary name="Regional"><RegionalAnalysis tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'probabilidade' && <ErrorBoundary name="Probabilidades"><ProbabilityCalculator tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'timecoracao' && <ErrorBoundary name="Time/Mês"><TimeCoracaoRanking tipo={selectedLoteria} /></ErrorBoundary>}
                {activeTab === 'exportar' && <ErrorBoundary name="Exportar"><ExportTab tipo={selectedLoteria} /></ErrorBoundary>}
              </div>
            )}
          </>
        )}
      </div>

      <AppFooter />
    </main>
  );
}
