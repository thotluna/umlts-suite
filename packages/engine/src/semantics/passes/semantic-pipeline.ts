import type { ProgramNode } from '../../syntax/nodes'
import type { AnalysisSession } from '../session/analysis-session'
import type { ISemanticPass } from './semantic-pass.interface'

/**
 * Orquestador de una secuencia de pases semánticos.
 * Permite añadir, eliminar o reordenar pases sin cambiar el analizador principal.
 */
export class SemanticPipeline {
  private readonly passes: ISemanticPass[] = []

  /**
   * Añade un pase al final de la tubería.
   */
  public use(pass: ISemanticPass): this {
    this.passes.push(pass)
    return this
  }

  /**
   * Devuelve todos los pases registrados.
   */
  public getPasses(): ISemanticPass[] {
    return this.passes
  }

  /**
   * Ejecuta todos los pases registrados en orden secuencial.
   */
  public async execute(program: ProgramNode, session: AnalysisSession): Promise<void> {
    for (const pass of this.passes) {
      const result = pass.execute(program, session)
      if (result instanceof Promise) {
        await result
      }
    }
  }
}
