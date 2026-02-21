/**
 * Re-exportación de los modelos de la IR desde el Renderer.
 * El Renderer es el dueño del contrato de visualización.
 */
export {
  IREntityType,
  IRRelationshipType,
  IRVisibility,
} from '@umlts/renderer/src/core/contract/ir'

export type {
  IRDiagram,
  IREntity,
  IRRelationship,
  IRProperty,
  IROperation,
  IRParameter,
  IRConstraint,
  IRMultiplicity,
  IRModifiers,
  IREnumerationLiteral,
} from '@umlts/renderer/src/core/contract/ir'
