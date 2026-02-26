'use client';

import clsx from 'clsx';

export interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AnalysisTabsProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  loteriaColor?: string;
}

export function AnalysisTabs({ tabs, activeTab, onTabChange, loteriaColor }: AnalysisTabsProps) {
  return (
    <nav
      className="hidden lg:flex flex-col gap-1 bg-bg-secondary rounded-lg p-2 sticky top-[73px] self-start min-w-[160px] border border-border-primary"
      aria-label="Abas de análise"
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left whitespace-nowrap',
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
  );
}

export function AnalysisTabsMobile({ tabs, activeTab, onTabChange, loteriaColor }: AnalysisTabsProps) {
  return (
    <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin" role="tablist" aria-label="Abas de análise">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0',
            activeTab === tab.id
              ? 'text-white shadow-sm'
              : 'bg-surface-primary text-text-tertiary hover:text-text-primary'
          )}
          style={activeTab === tab.id ? { backgroundColor: loteriaColor || '#374151' } : {}}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
