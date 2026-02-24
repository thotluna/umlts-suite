import type { IREntity, IRRelationship, IRDiagram } from '@engine/generator/ir/models'
import type { ISemanticContext } from './semantic-context.interface'

export enum SemanticTargetType {
  ENTITY = 'entity',
  RELATIONSHIP = 'relationship',
  DIAGRAM = 'diagram',
}

export interface RuleTargetMap {
  [SemanticTargetType.ENTITY]: IREntity
  [SemanticTargetType.RELATIONSHIP]: IRRelationship
  [SemanticTargetType.DIAGRAM]: IRDiagram
}

/**
 * Base Interface for stateless semantic rules.
 */
export interface ISemanticRule<K extends keyof RuleTargetMap = keyof RuleTargetMap> {
  readonly id: string
  readonly target: K

  validate(element: RuleTargetMap[K], context: ISemanticContext): void
}
