import type { IRDiagram, IRRelationship, IREntity } from '@engine/generator/ir/models'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import type { ConfigStore } from '@engine/semantics/session/config-store'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'
import type { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'

/**
 * Encapsulates the complete state of a semantic analysis session.
 * Implements ISemanticState to provide a formal contract for analyzers.
 */
export class AnalysisSession implements ISemanticState {
  public readonly relationships: IRRelationship[] = []

  constructor(
    public readonly symbolTable: SymbolTable,
    public readonly constraintRegistry: ConstraintRegistry,
    public readonly configStore: ConfigStore,
    public readonly context: ISemanticContext,
    public readonly typeResolver: TypeResolutionPipeline,
  ) {}

  public recordRelationship(relationship: IRRelationship): void {
    this.relationships.push(relationship)
  }

  public getEntity(id: string): IREntity | undefined {
    return this.symbolTable.get(id)
  }

  /**
   * Compiles the current session state into the final IR Diagram.
   */
  public toIRDiagram(): IRDiagram {
    return {
      entities: this.symbolTable.getAllEntities(),
      relationships: this.relationships,
      constraints: this.constraintRegistry.getAll(),
      config: this.configStore.get(),
    }
  }
}
