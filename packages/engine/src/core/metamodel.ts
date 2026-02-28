/**
 * UML 2.5.1 Metamodel Core
 * Este archivo define las Metaclases base que el motor UMLTS reconoce.
 * Todas las entidades del AST y la IR deben mapearse a una de estas.
 */

export enum UMLMetaclass {
  // Clasificadores (Cláusulas 10 y 11)
  CLASS = 'Class',
  INTERFACE = 'Interface',
  SIGNAL = 'Signal',
  DATA_TYPE = 'DataType',
  ENUMERATION = 'Enumeration',
  PRIMITIVE_TYPE = 'PrimitiveType',
  COMPONENT = 'Component', // Extensión común
  NODE = 'Node', // Despliegue
  ARTIFACT = 'Artifact', // Despliegue

  // Características (Cláusula 9)
  PROPERTY = 'Property',
  OPERATION = 'Operation',
  PARAMETER = 'Parameter',
  ENUMERATION_LITERAL = 'EnumerationLiteral',

  // Relaciones (Cláusulas 7, 9, 11)
  ASSOCIATION_CLASS = 'AssociationClass', // Cláusula 11.8.2
  ASSOCIATION = 'Association',
  GENERALIZATION = 'Generalization',
  INTERFACE_REALIZATION = 'InterfaceRealization',
  DEPENDENCY = 'Dependency',
  USAGE = 'Usage',
  REALIZATION = 'Realization',
  ABSTRACTION = 'Abstraction',

  // Paquetes (Cláusula 12)
  PACKAGE = 'Package',
  MODEL = 'Model',
  PROFILE = 'Profile',

  // Otros
  STEREOTYPE = 'Stereotype',
  CONSTRAINT = 'Constraint',
  COMMENT = 'Comment',
}

/**
 * Define las propiedades base que toda instancia de una metaclase posee.
 */
export interface MetaclassDefinition {
  kind: UMLMetaclass
  isAbstract?: boolean
  extends?: UMLMetaclass // Jerarquía de metaclases (ej. Class extends Classifier)
}
