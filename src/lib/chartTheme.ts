import type { PartialTheme } from '@nivo/theming';

export const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const nivoTheme: PartialTheme = {
  text: { fill: 'var(--color-text-secondary)', fontSize: 12 },
  axis: {
    ticks: {
      text: { fill: 'var(--color-text-tertiary)', fontSize: 11 },
    },
    legend: {
      text: { fill: 'var(--color-text-secondary)', fontSize: 12 },
    },
  },
  grid: {
    line: { stroke: 'var(--color-border-primary)', strokeWidth: 1, strokeOpacity: 0.3 },
  },
  crosshair: {
    line: { stroke: 'var(--color-text-tertiary)', strokeWidth: 1 },
  },
  tooltip: {
    container: {
      background: 'var(--color-surface-primary)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: '8px',
      color: 'var(--color-text-primary)',
      fontSize: 13,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
  },
  labels: {
    text: { fill: '#fff', fontSize: 11, fontWeight: 600 },
  },
};
