import type { IRRelationship, IREntity } from '@engine/generator/ir/models'
import type { ISemanticContext } from './semantic-context.interface'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import type { ConfigStore } from '@engine/semantics/session/config-store'

/**
 * Interface representing the state of a semantic analysis.
 * This contract allows analyzers to access the state without knowing the full implementation of the session.
 */
export interface ISemanticState {
  readonly relationships: IRRelationship[]
  readonly symbolTable: SymbolTable
  readonly constraintRegistry: ConstraintRegistry
  readonly configStore: ConfigStore
  readonly context: ISemanticContext
  readonly typeResolver: import('@engine/semantics/inference/type-resolution.pipeline').TypeResolutionPipeline

  /**
   * Records a new relationship in the state.
   */
  recordRelationship(relationship: IRRelationship): void

  /**
   * Retrieves an entity by its ID.
   */
  getEntity(id: string): IREntity | undefined
}
