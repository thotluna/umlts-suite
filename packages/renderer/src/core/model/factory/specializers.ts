import { IREntity } from '@umlts/engine'
import { UMLNode } from '../index'

/**
 * Predicate to check if an entity matches a specific specialization.
 */
export type SpecializationPredicate = (entity: IREntity) => boolean

/**
 * Factory function for a specific node type.
 */
export type NodeCreator = (id: string) => UMLNode

/**
 * NodeSpecializer: Defines a rule to create a specific class based on IR state.
 */
export interface NodeSpecializer {
  predicate: SpecializationPredicate
  creator: NodeCreator
}
