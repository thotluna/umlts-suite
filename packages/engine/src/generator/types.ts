import type { IRDiagram } from '@engine/generator/ir/models'
import type { Diagnostic } from '@engine/syntax/diagnostic.types'
import type { ProgramNode } from '@engine/syntax/nodes'

/**
 * Resultado de una operación de parseo del motor.
 */

export interface ParseResult {
  /** El diagrama resultante en Representación Intermedia (IR) */
  diagram: IRDiagram
  /** El AST crudo resultante de la fase de parseo (Opcional, útil para testing) */
  ast?: ProgramNode
  /** Lista de diagnósticos (errores léxicos, sintácticos y semánticos) */
  diagnostics: Diagnostic[]
  /** Indica si hubo errores fatales que impidieron generar un diagrama válido */
  isValid: boolean
}
