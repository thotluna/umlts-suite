import type { ISemanticContext } from './semantic-context.interface'

export enum SemanticTargetType {
  ENTITY = 'entity',
  RELATIONSHIP = 'relationship',
  DIAGRAM = 'diagram',
}

/**
 * Base Interface for stateless semantic rules.
 */
export interface ISemanticRule<T> {
  readonly id: string
  readonly target: SemanticTargetType

  validate(element: T, context: ISemanticContext): void
}
