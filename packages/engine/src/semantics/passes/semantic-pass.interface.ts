import type { ProgramNode } from '../../syntax/nodes'
import type { AnalysisSession } from '../session/analysis-session'

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
   * Ejecuta la lógica de análisis sobre el AST y la sesión proporcionada.
   */
  execute(program: ProgramNode, session: AnalysisSession): void | Promise<void>
}
