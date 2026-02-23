import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { TokenType } from '@engine/syntax/token.types'
import type { Token } from '@engine/syntax/token.types'

export interface MultiplicityBounds {
  lower: number
  upper: number // Infinity for '*'
}

/**
 * Utility to parse and validate UML multiplicities.
 */
export class MultiplicityValidator {
  /**
   * Parses a multiplicity string (e.g., "1", "0..1", "*", "1..*") into bounds.
   * Returns null if the format is invalid.
   */
  public static parse(multiplicity: string): MultiplicityBounds | null {
    let cleaned = multiplicity.trim()
    if (!cleaned) return null

    // Remove brackets if present: [1..*] -> 1..*
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      cleaned = cleaned.substring(1, cleaned.length - 1).trim()
    }
    // Remove quotes if present: "1" -> 1
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.substring(1, cleaned.length - 1).trim()
    }

    if (!cleaned) return null

    // Single value case: "1" or "*"
    if (!cleaned.includes('..')) {
      if (cleaned === '*') {
        return { lower: 0, upper: Infinity }
      }
      const val = parseInt(cleaned, 10)
      if (isNaN(val)) return null
      return { lower: val, upper: val }
    }

    // Range case: "0..1", "1..*"
    const parts = cleaned.split('..')
    if (parts.length !== 2) return null

    const lowerPart = parts[0].trim()
    const upperPart = parts[1].trim()

    const lower = parseInt(lowerPart, 10)
    if (isNaN(lower)) return null

    let upper: number
    if (upperPart === '*') {
      upper = Infinity
    } else {
      upper = parseInt(upperPart, 10)
      if (isNaN(upper)) return null
    }

    return { lower, upper }
  }

  /**
   * Validates upper >= lower rule.
   */
  public static validateBounds(
    multiplicity: string,
    line?: number,
    column?: number,
    context?: ISemanticContext,
  ): MultiplicityBounds | null {
    const bounds = this.parse(multiplicity)

    if (!bounds) {
      context?.addError(
        `Invalid multiplicity format: '${multiplicity}'. Expected a number or a range (e.g., '1', '0..1', '1..*').`,
        { line, column, type: TokenType.UNKNOWN, value: multiplicity } as Token,
        DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
      )
      return null
    }

    if (bounds.upper < bounds.lower) {
      context?.addError(
        `Inconsistent multiplicity: The upper bound (${
          bounds.upper === Infinity ? '*' : bounds.upper
        }) must be greater than or equal to the lower bound (${bounds.lower}).`,
        { line, column, type: TokenType.UNKNOWN, value: multiplicity } as Token,
        DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
      )
    }

    return bounds
  }
}
