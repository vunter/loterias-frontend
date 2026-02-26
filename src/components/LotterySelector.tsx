'use client';

import { TipoLoteria, LOTERIAS } from '@/lib/api';
import clsx from 'clsx';

interface LotterySelectorProps {
  selected: TipoLoteria;
  onSelect: (tipo: TipoLoteria) => void;
}

export function LotterySelector({ selected, onSelect }: LotterySelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 p-3 bg-bg-secondary rounded-lg" role="radiogroup" aria-label="Selecionar loteria">
      {LOTERIAS.map((loteria) => (
        <button
          key={loteria.value}
          role="radio"
          aria-checked={selected === loteria.value}
          onClick={() => onSelect(loteria.value)}
          className={clsx(
            'px-2 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm text-center',
            'hover:scale-105 hover:shadow-lg',
            selected === loteria.value
              ? 'text-white shadow-lg scale-105'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
          )}
          style={selected === loteria.value ? { backgroundColor: loteria.color } : {}}
        >
          {loteria.label}
        </button>
      ))}
    </div>
  );
}
