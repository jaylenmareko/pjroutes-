const DANGEROUS = /<[^>]*>|javascript:|on\w+\s*=|'|"|;|--|\/\.\.\//gi

export function sanitize(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(DANGEROUS, '').slice(0, 500)
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)])
    )
  }
  return value
}
