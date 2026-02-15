import { IREntityType, IRRelationshipType } from '../../generator/ir/models'
import type { TypeInferrer } from '../analyzers/type-inferrer'

/**
 * Registers the default inference rules for standard UML types.
 *
 * This configuration adheres to standard UML semantics:
 * - A CLASS can only IMPLEMENT an INTERFACE.
 * - An INTERFACE can only INHERIT from another INTERFACE.
 * - By default, relationships target CLASSES.
 */
export function registerDefaultInferenceRules(inferrer: TypeInferrer): void {
  // Rule: Class implements Interface
  inferrer.register(IREntityType.CLASS, IRRelationshipType.IMPLEMENTATION, IREntityType.INTERFACE)

  // Rule: Interface inherits Interface
  inferrer.register(IREntityType.INTERFACE, IRRelationshipType.INHERITANCE, IREntityType.INTERFACE)

  // Rule: Class inherits Class
  inferrer.register(IREntityType.CLASS, IRRelationshipType.INHERITANCE, IREntityType.CLASS)

  // Standard Relationships defaulting to Class target
  const standardRelationships = [
    IRRelationshipType.ASSOCIATION,
    IRRelationshipType.COMPOSITION,
    IRRelationshipType.AGGREGATION,
    IRRelationshipType.DEPENDENCY,
    IRRelationshipType.REALIZATION,
    IRRelationshipType.BIDIRECTIONAL,
  ]

  standardRelationships.forEach((rel) => {
    inferrer.register(IREntityType.CLASS, rel, IREntityType.CLASS)
    inferrer.register(IREntityType.INTERFACE, rel, IREntityType.INTERFACE) // Interfaces depend on interfaces usually
    inferrer.register(IREntityType.ENUM, rel, IREntityType.CLASS) // Enums relate to classes
  })
}
