'use client';

import { memo, useState } from 'react';
import {
  LayoutDashboard, Sparkles, Layers, Shuffle, CloudDownload, Clock,
  RefreshCw, TrendingUp, ListOrdered, DollarSign, Dices, Search,
  BarChart2, MapPin, Calculator, Download, Heart, Menu, X,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import clsx from 'clsx';

export type Section = 'loterias' | 'especiais' | 'dupla-sena' | 'multi-gerador';

export interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: TabDef[];
  syncing: boolean;
  loading: boolean;
  syncCooldown: number;
  formatCooldown: (seconds: number) => string;
  onSync: () => void;
  onRefresh: () => void;
  loteriaColor?: string;
}

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { id: 'loterias', label: 'Loterias', icon: <LayoutDashboard className="w-4 h-4" />, activeClass: 'bg-surface-secondary text-text-primary' },
  { id: 'especiais', label: 'Especiais', icon: <Sparkles className="w-4 h-4" />, activeClass: 'bg-yellow-600 text-white' },
  { id: 'dupla-sena', label: 'Dupla Sena', icon: <Layers className="w-4 h-4" />, activeClass: 'bg-red-600 text-white' },
  { id: 'multi-gerador', label: 'Multi Gerador', icon: <Shuffle className="w-4 h-4" />, activeClass: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' },
];

export function Sidebar({
  activeSection, onSectionChange,
  activeTab, onTabChange, tabs,
  syncing, loading, syncCooldown, formatCooldown,
  onSync, onRefresh, loteriaColor,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg-secondary border-b border-border-primary px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          🎰 Loterias
        </h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-surface-primary text-text-tertiary hover:bg-surface-secondary"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-full bg-bg-secondary border-r border-border-primary flex flex-col',
          'w-56 transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border-primary">
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            🎰 Loterias Analyzer
          </h1>
        </div>

        {/* Sections */}
        <div className="px-3 py-3 border-b border-border-primary">
          <span className="text-[10px] uppercase tracking-wider text-text-muted px-2 mb-1 block">Seções</span>
          <nav className="flex flex-col gap-0.5" aria-label="Navegação principal">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => { onSectionChange(s.id); setMobileOpen(false); }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                  activeSection === s.id ? s.activeClass : 'text-text-tertiary hover:text-text-primary hover:bg-surface-primary'
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Analysis tabs (only when "loterias" section is active) */}
        {activeSection === 'loterias' && tabs.length > 0 && (
          <div className="px-3 py-3 flex-1 overflow-y-auto">
            <span className="text-[10px] uppercase tracking-wider text-text-muted px-2 mb-1 block">Análises</span>
            <nav className="flex flex-col gap-0.5" aria-label="Abas de análise">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                    activeTab === tab.id
                      ? 'text-white shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-surface-primary'
                  )}
                  style={activeTab === tab.id ? { backgroundColor: loteriaColor || '#374151' } : {}}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {activeSection !== 'loterias' && <div className="flex-1" />}

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-border-primary flex flex-col gap-2 mt-auto">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-surface-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
              title="Recarregar dados"
              aria-label="Recarregar dados"
            >
              <RefreshCw className={clsx('w-4 h-4 text-text-tertiary', loading && 'animate-spin')} />
            </button>
          </div>
          <button
            onClick={onSync}
            disabled={syncing || loading || syncCooldown > 0}
            className={clsx(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-white text-sm w-full',
              syncCooldown > 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-600 disabled:opacity-50'
            )}
            title={syncCooldown > 0 ? `Aguarde ${formatCooldown(syncCooldown)}` : 'Sincronizar da Caixa'}
            aria-label={syncCooldown > 0 ? `Aguarde ${formatCooldown(syncCooldown)}` : 'Sincronizar da Caixa'}
          >
            {syncCooldown > 0 ? (
              <><Clock className="w-4 h-4" /><span>{formatCooldown(syncCooldown)}</span></>
            ) : syncing ? (
              <><CloudDownload className="w-4 h-4 animate-pulse" />Sincronizando...</>
            ) : (
              <><CloudDownload className="w-4 h-4" />Atualizar da Caixa</>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
