// Main API exports
export type { ParseResult } from '@engine/generator/types'

// IR (Intermediate Representation) model exports
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

// Diagnostics exports
export type { Diagnostic, DiagnosticSeverity } from '@engine/syntax/diagnostic.types'

export * from '@engine/UMLEngine'

// Plugin System exports
export * from './plugin/plugin.types'
export * from './plugin/language.types'
