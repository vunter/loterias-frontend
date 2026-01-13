'use client';

import clsx from 'clsx';

interface NumberBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'hot' | 'cold' | 'late' | 'selected' | 'secondary';
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const variantClasses = {
  default: 'bg-surface-inverted text-text-on-inverted',
  hot: 'bg-gradient-to-br from-red-500 to-orange-500 text-white',
  cold: 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white',
  late: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
  selected: 'bg-gradient-to-br from-green-500 to-emerald-500 text-white ring-2 ring-green-300',
  secondary: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white',
};

export function NumberBall({ number, size = 'md', variant = 'default', onClick }: NumberBallProps) {
  const classes = clsx(
    'rounded-full font-bold flex items-center justify-center shadow-md transition-transform',
    sizeClasses[size],
    variantClasses[variant],
    onClick && 'hover:scale-110 cursor-pointer'
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={classes} aria-label={`Número ${number}`}>
        {number.toString().padStart(2, '0')}
      </button>
    );
  }

  return (
    <span className={classes}>
      {number.toString().padStart(2, '0')}
    </span>
  );
}
