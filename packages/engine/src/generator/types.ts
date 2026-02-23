import type { IRDiagram } from '@engine/generator/ir/models'
import type { Diagnostic } from '@engine/syntax/diagnostic.types'

/**
 * Resultado de una operación de parseo del motor.
 */

export interface ParseResult {
  /** El diagrama resultante en Representación Intermedia (IR) */
  diagram: IRDiagram
  /** Lista de diagnósticos (errores léxicos, sintácticos y semánticos) */
  diagnostics: Diagnostic[]
  /** Indica si hubo errores fatales que impidieron generar un diagrama válido */
  isValid: boolean
}
