import type { IRMultiplicity } from '@umlts/engine'

/**
 * Normalizes multiplicity from the IR to a standard UML format.
 */
export function normalizeMultiplicity(m: IRMultiplicity | string | undefined): string {
  if (!m) return ''

  if (typeof m === 'string') {
    let normalized = m.trim()
    if (normalized.toLowerCase() === 'many') return '*'
    if (normalized === '[]') return '0..*'
    if (normalized.startsWith('[') && normalized.endsWith(']')) {
      normalized = normalized.substring(1, normalized.length - 1)
    }
    return normalized
  }

  const { lower, upper } = m
  if (lower === upper) return `${lower}`
  return `${lower}..${upper}`
}
