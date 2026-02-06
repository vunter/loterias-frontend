import logger from './logger'

interface MetricData {
  name: string
  value: number
  labels?: Record<string, string>
  timestamp?: number
}

class MetricsCollector {
  private static readonly MAX_BUFFER_SIZE = 1000
  private static readonly MAX_CONSECUTIVE_FAILURES = 5

  private metrics: MetricData[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private consecutiveFailures = 0
  private readonly pushGatewayUrl: string

  constructor() {
    this.pushGatewayUrl = process.env.PROMETHEUS_PUSHGATEWAY_URL || 'http://localhost:9091'
    
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      this.startFlushInterval()
    }
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 15000)
  }

  increment(name: string, labels?: Record<string, string>) {
    this.record(name, 1, labels)
  }

  record(name: string, value: number, labels?: Record<string, string>) {
    if (this.metrics.length >= MetricsCollector.MAX_BUFFER_SIZE) {
      this.metrics.splice(0, Math.floor(MetricsCollector.MAX_BUFFER_SIZE / 4))
    }
    this.metrics.push({
      name,
      value,
      labels: { ...labels, application: 'loterias-frontend' },
      timestamp: Date.now(),
    })
  }

  timing(name: string, durationMs: number, labels?: Record<string, string>) {
    this.record(`${name}_duration_ms`, durationMs, labels)
  }

  async flush() {
    if (this.metrics.length === 0) return

    const metricsToSend = [...this.metrics]
    this.metrics = []

    try {
      const escapeLabel = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
      const prometheusFormat = metricsToSend
        .map((m) => {
          const labelStr = m.labels
            ? `{${Object.entries(m.labels)
                .map(([k, v]) => `${k}="${escapeLabel(v)}"`)
                .join(',')}}`
            : ''
          return `${m.name}${labelStr} ${m.value} ${m.timestamp}`
        })
        .join('\n')

      await fetch(`${this.pushGatewayUrl}/metrics/job/loterias-frontend`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: prometheusFormat,
      })
      this.consecutiveFailures = 0
    } catch (error) {
      this.consecutiveFailures++
      if (this.consecutiveFailures < MetricsCollector.MAX_CONSECUTIVE_FAILURES) {
        const requeue = metricsToSend.slice(-Math.floor(MetricsCollector.MAX_BUFFER_SIZE / 2))
        this.metrics.unshift(...requeue)
      }
      logger.error({ error, consecutiveFailures: this.consecutiveFailures }, 'Failed to push metrics')
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
  }
}

const globalForMetrics = globalThis as unknown as { __metricsCollector?: MetricsCollector }
const metrics = globalForMetrics.__metricsCollector ?? (globalForMetrics.__metricsCollector = new MetricsCollector())

export default metrics
