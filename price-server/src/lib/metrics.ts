import { Counter, UpDownCounter } from '@opentelemetry/api-metrics'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { Meter, MeterProvider } from '@opentelemetry/metrics'
import * as config from 'config'

let meterProvider = new MeterProvider()

export async function setupMetricsServer() {
  if (!config.metricsPort) return
  const exporter = new PrometheusExporter({
    preventServerStart: true,
    port: config.metricsPort,
  })
  meterProvider = new MeterProvider({
    exporter,
    interval: 3000,
  })
  await exporter.startServer()
}

export let meter: Meter
let requestCount: Counter
const quoterAlive = new Map()

function setupMetrics() {
  if (meter) return
  meter = meterProvider.getMeter('terra-oracle-feeder')
  requestCount = meter.createCounter('requests', {
    description: 'Count all incoming requests',
  })
  meter.createUpDownSumObserver(
    'terra_oracle_up',
    {
      description: '1 if price-server quoter is up, or 0 is failed',
    },
    async (observerResult) => {
      for (const [name, isAlive] of quoterAlive) {
        observerResult.observe(isAlive ? 1 : 0, { oracle_source: name })
      }
    }
  )
}

const boundInstruments = new Map()

export const countAllRequests = () => {
  setupMetrics()
  return (req, res, next) => {
    if (!boundInstruments.has(req.path)) {
      const labels = { route: req.path }
      const boundCounter = requestCount.bind(labels)
      boundInstruments.set(req.path, boundCounter)
    }
    boundInstruments.get(req.path).add(1)
    next()
  }
}

export function setQuoterAlive(name: string, isAlive: boolean) {
  setupMetrics()
  quoterAlive.set(name, isAlive)
}
