import pino from 'pino'

const isServer = typeof window === 'undefined'

interface LogFn {
  (obj: Record<string, unknown>, msg?: string): void;
  (msg: string): void;
}

interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
  trace: LogFn;
}

function createClientLogger(): Logger {
  const level = process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';
  const levels: Record<string, number> = { trace: 10, debug: 20, info: 30, warn: 40, error: 50 };
  const threshold = levels[level] ?? 30;

  const noop: LogFn = () => {};
  const wrap = (lvl: number, method: 'log' | 'warn' | 'error' | 'debug'): LogFn => {
    if (lvl < threshold) return noop;
    return (...args: unknown[]) => {
      // eslint-disable-next-line no-console
      (console[method] as (...a: unknown[]) => void)('[loterias]', ...args);
    };
  };

  return {
    trace: wrap(10, 'debug'),
    debug: wrap(20, 'debug'),
    info: wrap(30, 'log'),
    warn: wrap(40, 'warn'),
    error: wrap(50, 'error'),
  };
}

const logger: Logger = isServer
  ? pino({
      level: process.env.LOG_LEVEL || 'info',
      base: {
        application: 'loterias-frontend',
        environment: process.env.NODE_ENV || 'development',
      },
      ...(process.env.NODE_ENV === 'production'
        ? {
            transport: {
              target: 'pino-loki',
              options: {
                host: process.env.LOKI_URL || 'http://localhost:3100',
                labels: {
                  application: 'loterias-frontend',
                  environment: process.env.NODE_ENV || 'development',
                },
                batching: true,
                interval: 5,
              },
            },
          }
        : {}),
    })
  : createClientLogger();

export default logger
