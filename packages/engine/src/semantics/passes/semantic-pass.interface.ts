import type { ProgramNode } from '@engine/syntax/nodes'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'

/**
 * Contrato para todas las fases de análisis semántico.
 * Cada pase es responsable de un aspecto único del análisis.
 */
export interface ISemanticPass {
  /**
   * Nombre único del pase para depuración y logs.
   */
  readonly name: string

  /**
   * Ejecuta la lógica de análisis sobre el AST y el estado proporcionado.
   */
  execute(program: ProgramNode, state: ISemanticState): void
}
