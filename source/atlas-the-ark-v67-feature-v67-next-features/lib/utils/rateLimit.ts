const WINDOWS: Map<string, { count: number; reset: number }> = new Map()
export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000) {
  const now = Date.now()
  const window = WINDOWS.get(key)
  if (!window || now > window.reset) {
    WINDOWS.set(key, { count: 1, reset: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  if (window.count >= maxRequests) return { allowed: false, remaining: 0 }
  window.count++
  return { allowed: true, remaining: maxRequests - window.count }
}
