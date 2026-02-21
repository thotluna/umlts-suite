// Exportación de la API principal
export { UMLEngine } from './index'
export type { ParseResult } from './generator/types'

// Exportación de modelos de la IR (Representación Intermedia)
export { IREntityType, IRRelationshipType, IRVisibility } from './generator/ir/models'

export type {
  IRDiagram,
  IREntity,
  IRRelationship,
  IRProperty,
  IROperation,
  IRParameter,
  IRConstraint,
} from './generator/ir/models'

// Exportación de diagnósticos
export type { Diagnostic, DiagnosticSeverity } from './syntax/diagnostic.types'
