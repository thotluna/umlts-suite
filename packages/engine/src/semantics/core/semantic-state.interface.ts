import type { IRRelationship, IREntity, IRNote, IRAnchor } from '@engine/generator/ir/models'
import type { ISemanticContext } from './semantic-context.interface'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import type { ConfigStore } from '@engine/semantics/session/config-store'
import type { ProfileRegistry } from '@engine/semantics/profiles/profile.registry'

/**
 * Interface representing the state of a semantic analysis.
 * This contract allows analyzers to access the state without knowing the full implementation of the session.
 */
export interface ISemanticState {
  readonly relationships: IRRelationship[]
  readonly symbolTable: SymbolTable
  readonly constraintRegistry: ConstraintRegistry
  readonly configStore: ConfigStore
  readonly profileRegistry: ProfileRegistry
  readonly context: ISemanticContext
  readonly notes: IRNote[]
  readonly anchors: IRAnchor[]
  readonly typeResolver: import('@engine/semantics/inference/type-resolution.pipeline').TypeResolutionPipeline

  /**
   * Records a new note in the state.
   */
  recordNote(note: IRNote): void

  /**
   * Records a new anchor in the state.
   */
  recordAnchor(anchor: IRAnchor): void

  /**
   * Records a new relationship in the state.
   */
  recordRelationship(relationship: IRRelationship): void

  /**
   * Retrieves an entity by its ID.
   */
  getEntity(id: string): IREntity | undefined
}
