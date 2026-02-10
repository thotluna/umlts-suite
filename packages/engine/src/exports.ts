// Exportación de la API principal
export { UMLEngine } from './index';
export type { ParseResult } from './index';

// Exportación de modelos de la IR (Representación Intermedia)
export {
  IREntityType,
  IRRelationshipType,
  IRVisibility
} from './generator/ir/models';

export type {
  IRDiagram,
  IREntity,
  IRRelationship,
  IRMember
} from './generator/ir/models';

// Generadores
export { MermaidGenerator } from './generator/mermaid.generator';

// Exportación de diagnósticos
export type {
  Diagnostic,
  DiagnosticSeverity
} from './parser/diagnostic.types';
