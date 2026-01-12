'use client';

import { memo } from 'react';
import { LayoutDashboard, Sparkles, Layers, Shuffle, CloudDownload, Clock, RefreshCw } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import clsx from 'clsx';

export type Section = 'loterias' | 'especiais' | 'dupla-sena' | 'multi-gerador';

interface AppHeaderProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  syncing: boolean;
  loading: boolean;
  syncCooldown: number;
  formatCooldown: (seconds: number) => string;
  onSync: () => void;
  onRefresh: () => void;
}

export function AppHeader({
  activeSection,
  onSectionChange,
  syncing,
  loading,
  syncCooldown,
  formatCooldown,
  onSync,
  onRefresh,
}: AppHeaderProps) {
  return (
    <header className="bg-bg-secondary border-b border-border-primary sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              🎰 Loterias Analyzer
            </h1>
            <nav className="flex gap-1 bg-surface-primary rounded-lg p-1" aria-label="Navegação principal">
              <SectionButton
                active={activeSection === 'loterias'}
                onClick={() => onSectionChange('loterias')}
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Loterias"
                activeClass="bg-surface-secondary text-text-primary"
                hoverClass="text-text-tertiary hover:text-text-primary"
              />
              <SectionButton
                active={activeSection === 'especiais'}
                onClick={() => onSectionChange('especiais')}
                icon={<Sparkles className="w-4 h-4" />}
                label="Especiais"
                activeClass="bg-yellow-600 text-white"
                hoverClass="text-text-tertiary hover:text-yellow-400"
              />
              <SectionButton
                active={activeSection === 'dupla-sena'}
                onClick={() => onSectionChange('dupla-sena')}
                icon={<Layers className="w-4 h-4" />}
                label="Dupla Sena"
                activeClass="bg-red-600 text-white"
                hoverClass="text-text-tertiary hover:text-red-400"
              />
              <SectionButton
                active={activeSection === 'multi-gerador'}
                onClick={() => onSectionChange('multi-gerador')}
                icon={<Shuffle className="w-4 h-4" />}
                label="Multi Gerador"
                activeClass="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                hoverClass="text-text-tertiary hover:text-blue-400"
              />
            </nav>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <button
              onClick={onSync}
              disabled={syncing || loading || syncCooldown > 0}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-white text-sm',
                syncCooldown > 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-600 disabled:opacity-50'
              )}
              title={syncCooldown > 0 ? `Aguarde ${formatCooldown(syncCooldown)} para sincronizar` : 'Sincronizar todas as loterias da Caixa'}
            >
              {syncCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>{formatCooldown(syncCooldown)}</span>
                </>
              ) : syncing ? (
                <>
                  <CloudDownload className="w-4 h-4 animate-pulse" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <CloudDownload className="w-4 h-4" />
                  Atualizar da Caixa
                </>
              )}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-surface-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
              title="Recarregar dados"
            >
              <RefreshCw className={clsx('w-5 h-5 text-text-tertiary', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const SectionButton = memo(function SectionButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
  hoverClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
  hoverClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
        active ? activeClass : hoverClass
      )}
    >
      {icon}
      {label}
    </button>
  );
});
