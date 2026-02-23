import { ASTNodeType } from '../../syntax/nodes'
import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  RelationshipHeaderNode,
  AttributeNode,
  MethodNode,
  ParameterNode,
  CommentNode,
  ConfigNode,
  TypeNode,
  AssociationClassNode,
  ConstraintNode,
  NoteNode,
  AnchorNode,
  StatementNode,
  MemberNode,
  Modifiers,
} from '../../syntax/nodes'
import type { Diagnostic } from '../../syntax/diagnostic.types'

/**
 * ASTFactory: Centraliza la creación de los nodos del Abstract Syntax Tree (AST).
 * Asegura la consistencia de las propiedades estructurales y facilita el mantenimiento.
 */
export class ASTFactory {
  public static createProgram(
    body: StatementNode[],
    line: number,
    column: number,
    diagnostics?: Diagnostic[],
  ): ProgramNode {
    return {
      type: ASTNodeType.PROGRAM,
      body,
      line,
      column,
      diagnostics,
    }
  }

  public static createPackage(
    name: string,
    body: StatementNode[],
    line: number,
    column: number,
    docs?: string,
  ): PackageNode {
    return {
      type: ASTNodeType.PACKAGE,
      name,
      body,
      line,
      column,
      docs,
    }
  }

  public static createEntity(
    type: ASTNodeType.CLASS | ASTNodeType.INTERFACE | ASTNodeType.ENUM,
    name: string,
    modifiers: Modifiers,
    relationships: RelationshipHeaderNode[],
    body: MemberNode[] | undefined,
    line: number,
    column: number,
    docs?: string,
    typeParameters?: string[],
  ): EntityNode {
    return {
      type,
      name,
      modifiers,
      relationships,
      body,
      line,
      column,
      docs,
      typeParameters,
    }
  }

  public static createRelationship(
    kind: string,
    from: string,
    to: string,
    isNavigable: boolean,
    line: number,
    column: number,
    options: Partial<RelationshipNode> = {},
  ): RelationshipNode {
    return {
      type: ASTNodeType.RELATIONSHIP,
      kind,
      from,
      to,
      isNavigable,
      fromMultiplicity: undefined,
      toMultiplicity: undefined,
      label: undefined,
      line,
      column,
      ...options,
    }
  }

  public static createRelationshipHeader(
    kind: string,
    target: string,
    isNavigable: boolean,
    line: number,
    column: number,
    targetModifiers?: Modifiers,
  ): RelationshipHeaderNode {
    return {
      type: ASTNodeType.RELATIONSHIP,
      kind,
      target,
      isNavigable,
      line,
      column,
      targetModifiers,
    }
  }

  public static createAttribute(
    name: string,
    visibility: string,
    typeAnnotation: TypeNode,
    modifiers: Modifiers,
    line: number,
    column: number,
    options: Partial<AttributeNode> = {},
  ): AttributeNode {
    return {
      type: ASTNodeType.ATTRIBUTE,
      name,
      visibility,
      typeAnnotation,
      modifiers,
      multiplicity: undefined,
      line,
      column,
      ...options,
    }
  }

  public static createMethod(
    name: string,
    visibility: string,
    returnType: TypeNode,
    modifiers: Modifiers,
    parameters: ParameterNode[],
    line: number,
    column: number,
    options: Partial<MethodNode> = {},
  ): MethodNode {
    return {
      type: ASTNodeType.METHOD,
      name,
      visibility,
      returnType,
      modifiers,
      parameters,
      line,
      column,
      ...options,
    }
  }

  public static createParameter(
    name: string,
    typeAnnotation: TypeNode,
    line: number,
    column: number,
    options: Partial<ParameterNode> = {},
  ): ParameterNode {
    return {
      type: ASTNodeType.PARAMETER,
      name,
      typeAnnotation,
      line,
      column,
      ...options,
    }
  }

  public static createType(
    name: string,
    kind: 'simple' | 'generic' | 'array' | 'enum' | 'xor',
    raw: string,
    line: number,
    column: number,
    options: Partial<TypeNode> = {},
  ): TypeNode {
    return {
      type: ASTNodeType.TYPE,
      name,
      kind,
      raw,
      line,
      column,
      ...options,
    }
  }

  public static createComment(value: string, line: number, column: number): CommentNode {
    return {
      type: ASTNodeType.COMMENT,
      value,
      line,
      column,
    }
  }

  public static createConfig(
    options: Record<string, unknown>,
    line: number,
    column: number,
  ): ConfigNode {
    return {
      type: ASTNodeType.CONFIG,
      options,
      line,
      column,
    }
  }

  public static createAssociationClass(
    name: string,
    participants: AssociationClassNode['participants'],
    line: number,
    column: number,
    body?: MemberNode[],
    docs?: string,
  ): AssociationClassNode {
    return {
      type: ASTNodeType.ASSOCIATION_CLASS,
      name,
      participants,
      body,
      line,
      column,
      docs,
    }
  }

  public static createConstraint(
    kind: string,
    line: number,
    column: number,
    options: Partial<ConstraintNode> = {},
  ): ConstraintNode {
    return {
      type: ASTNodeType.CONSTRAINT,
      kind,
      line,
      column,
      ...options,
    }
  }

  public static createNote(value: string, line: number, column: number, id?: string): NoteNode {
    return {
      type: ASTNodeType.NOTE,
      value,
      line,
      column,
      id,
    }
  }

  public static createAnchor(from: string, to: string[], line: number, column: number): AnchorNode {
    return {
      type: ASTNodeType.ANCHOR,
      from,
      to,
      line,
      column,
    }
  }
}
