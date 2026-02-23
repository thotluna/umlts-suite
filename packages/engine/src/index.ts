// Exportación de la API principal
export type { ParseResult } from '@engine/generator/types'

// Exportación de modelos de la IR (Representación Intermedia)
export { IREntityType, IRRelationshipType, IRVisibility } from '@engine/generator/ir/models'

export type {
  IRDiagram,
  IREntity,
  IRRelationship,
  IRProperty,
  IROperation,
  IRParameter,
  IRConstraint,
  IRMultiplicity,
} from '@engine/generator/ir/models'

// Exportación de diagnósticos
export type { Diagnostic, DiagnosticSeverity } from '@engine/syntax/diagnostic.types'

export * from '@engine/UMLEngine'
