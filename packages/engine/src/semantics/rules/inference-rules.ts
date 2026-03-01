import { IREntityType, IRRelationshipType } from '@engine/generator/ir/models'
import type { TypeInferrer } from '@engine/semantics/analyzers/type-inferrer'

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
  inferrer.register(
    IREntityType.CLASS,
    IRRelationshipType.INTERFACE_REALIZATION,
    IREntityType.INTERFACE,
  )

  // Rule: Interface inherits Interface
  inferrer.register(
    IREntityType.INTERFACE,
    IRRelationshipType.GENERALIZATION,
    IREntityType.INTERFACE,
  )

  // Rule: Class inherits Class
  inferrer.register(IREntityType.CLASS, IRRelationshipType.GENERALIZATION, IREntityType.CLASS)

  // Standard Relationships defaulting to Class target
  const standardRelationships = [
    IRRelationshipType.ASSOCIATION,
    IRRelationshipType.COMPOSITION,
    IRRelationshipType.AGGREGATION,
    IRRelationshipType.DEPENDENCY,
    IRRelationshipType.INTERFACE_REALIZATION,
    IRRelationshipType.BIDIRECTIONAL,
  ]

  standardRelationships.forEach((rel) => {
    inferrer.register(IREntityType.CLASS, rel, IREntityType.CLASS)
    inferrer.register(IREntityType.INTERFACE, rel, IREntityType.INTERFACE)
    inferrer.register(IREntityType.ENUMERATION, rel, IREntityType.CLASS)
    inferrer.register(IREntityType.ASSOCIATION_CLASS, rel, IREntityType.CLASS)
    inferrer.register(IREntityType.DATA_TYPE, rel, IREntityType.CLASS)
  })
}
