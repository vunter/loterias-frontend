'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error({ err: error }, 'Application error');
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h2>
        <p className="text-text-secondary mb-6">Erro inesperado na aplicação</p>
        {error.digest && <p className="text-text-secondary text-xs mb-4">Ref: {error.digest}</p>}
        <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
