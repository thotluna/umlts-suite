/**
 * Normalizes multiplicity strings from the IR to a standard UML format.
 * Examples:
 * - "[1]"    -> "1"
 * - "[*]"    -> "*"
 * - "[1..*]" -> "1..*"
 * - "many"   -> "*"
 * - "1"      -> "1"
 * - "[]"     -> "0..*"
 */
export function normalizeMultiplicity(raw: string | undefined): string {
  if (!raw) return ''

  let normalized = raw.trim()

  // Handle common text-based aliases
  if (normalized.toLowerCase() === 'many') return '*'
  if (normalized === '1') return '1'
  if (normalized === '[]') return '0..*'

  // Remove surrounding brackets if present
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    normalized = normalized.substring(1, normalized.length - 1)
  }

  // Handle internal normalization (e.g., [0..*])
  if (normalized === '*') return '*'

  return normalized
}
