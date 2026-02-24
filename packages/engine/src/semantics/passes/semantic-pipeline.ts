import type { ProgramNode } from '@engine/syntax/nodes'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'
import type { ISemanticPass } from '@engine/semantics/passes/semantic-pass.interface'

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
  public execute(program: ProgramNode, state: ISemanticState): void {
    for (const pass of this.passes) {
      pass.execute(program, state)
    }
  }
}
