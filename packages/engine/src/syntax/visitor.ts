import type {
  ASTNode,
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode,
  ConfigNode,
  AssociationClassNode,
  ConstraintNode,
} from '@engine/syntax/nodes'
import { ASTNodeType } from '@engine/syntax/nodes'

/**
 * Interfaz base para visitantes del AST.
 */
export interface ASTVisitor<T = void> {
  visitProgram: (node: ProgramNode) => T
  visitPackage: (node: PackageNode) => T
  visitEntity: (node: EntityNode) => T
  visitRelationship: (node: RelationshipNode) => T
  visitComment: (node: CommentNode) => T
  visitConfig: (node: ConfigNode) => T
  visitAssociationClass: (node: AssociationClassNode) => T
  visitConstraint: (node: ConstraintNode) => T
}

/**
 * Despachador universal para el patrón Visitor.
 * Permite recorrer el árbol sin que los nodos necesiten el método accept.
 */
export function walkAST<T>(node: ASTNode, visitor: ASTVisitor<T>): T {
  switch (node.type) {
    case ASTNodeType.PROGRAM:
      return visitor.visitProgram(node as ProgramNode)
    case ASTNodeType.PACKAGE:
      return visitor.visitPackage(node as PackageNode)
    case ASTNodeType.CLASS:
    case ASTNodeType.INTERFACE:
    case ASTNodeType.ENUM:
      return visitor.visitEntity(node as EntityNode)
    case ASTNodeType.RELATIONSHIP:
      return visitor.visitRelationship(node as RelationshipNode)
    case ASTNodeType.COMMENT:
      return visitor.visitComment(node as CommentNode)
    case ASTNodeType.CONFIG:
      return visitor.visitConfig(node as ConfigNode)
    case ASTNodeType.ASSOCIATION_CLASS:
      return visitor.visitAssociationClass(node as AssociationClassNode)
    case ASTNodeType.CONSTRAINT:
      return visitor.visitConstraint(node as ConstraintNode)
    default:
      throw new Error(`Tipo de nodo no visitable: ${node.type}`)
  }
}
