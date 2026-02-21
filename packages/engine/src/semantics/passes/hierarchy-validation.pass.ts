import type { ProgramNode } from '../../syntax/nodes'
import type { AnalysisSession } from '../session/analysis-session'
import type { HierarchyValidator } from '../validators/hierarchy-validator'
import type { ISemanticPass } from './semantic-pass.interface'

/**
 * Pase 1.5: Validación de Jerarquía.
 * Asegura que todas las entidades descubiertas tengan reglas de herencia/implementación válidas.
 * Extraído de SemanticAnalyzer para pureza de la tubería.
 */
export class HierarchyValidationPass implements ISemanticPass {
  public readonly name = 'HierarchyValidation'

  constructor(private readonly hierarchyValidator: HierarchyValidator) {}

  public execute(_program: ProgramNode, session: AnalysisSession): void {
    session.symbolTable.getAllEntities().forEach((entity) => {
      this.hierarchyValidator.validateEntity(entity)
    })
  }
}
