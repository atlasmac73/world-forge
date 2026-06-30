// lib/observability/logger.ts
// Lightweight structured logging with correlation IDs. No external service required.
// Logs JSON to stdout (captured by Vercel) and optionally to Supabase audit_log.

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  correlationId?: string
  userId?: string
  route?: string
  agent?: string
  [key: string]: unknown
}

function emit(level: LogLevel, message: string, ctx: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...ctx,
  }
  // Structured JSON line — Vercel log drains and most aggregators parse this natively
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
  return entry
}

export const log = {
  debug: (m: string, c?: LogContext) => emit('debug', m, c),
  info: (m: string, c?: LogContext) => emit('info', m, c),
  warn: (m: string, c?: LogContext) => emit('warn', m, c),
  error: (m: string, c?: LogContext) => emit('error', m, c),
}

// Generate a correlation ID for request tracing
export function newCorrelationId(): string {
  return 'atlas_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Wrap an async route handler with timing + correlation logging
export async function withTrace<T>(
  name: string,
  fn: (correlationId: string) => Promise<T>,
  ctx: LogContext = {}
): Promise<T> {
  const correlationId = ctx.correlationId ?? newCorrelationId()
  const start = Date.now()
  log.info(`${name} started`, { ...ctx, correlationId })
  try {
    const result = await fn(correlationId)
    log.info(`${name} ok`, { ...ctx, correlationId, ms: Date.now() - start })
    return result
  } catch (err) {
    log.error(`${name} failed`, {
      ...ctx,
      correlationId,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
