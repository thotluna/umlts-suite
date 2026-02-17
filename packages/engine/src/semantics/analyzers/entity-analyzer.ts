import type { IRMember, IREntity } from '../../generator/ir/models'
import { IREntityType, IRVisibility } from '../../generator/ir/models'
import type { SymbolTable } from '../symbol-table'
import type { ParserContext } from '../../parser/parser.context'
import { DiagnosticCode } from '../../syntax/diagnostic.types'
import { TypeValidator } from '../utils/type-validator'
import { FQNBuilder } from '../utils/fqn-builder'
import { MultiplicityValidator } from '../utils/multiplicity-validator'
import { TokenType } from '../../syntax/token.types'
import type { Token } from '../../syntax/token.types'
import type {
  EntityNode,
  MemberNode,
  AttributeNode,
  MethodNode,
  AssociationClassNode,
  ConstraintNode,
} from '../../syntax/nodes'
import { ASTNodeType } from '../../syntax/nodes'
import type { ConstraintAnalyzer } from './constraint-analyzer'

/**
 * Handles the declaration of entities and their members.
 */
export class EntityAnalyzer {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly constraintAnalyzer: ConstraintAnalyzer,
    private readonly context: ParserContext,
  ) {}

  /**
   * Builds an IREntity from an EntityNode (shallow version, no members).
   */
  public buildEntity(node: EntityNode, namespace: string): IREntity {
    const fqn = FQNBuilder.build(node.name, namespace)
    const { name: shortName, namespace: entityNamespace } = FQNBuilder.split(fqn)

    return {
      id: fqn,
      name: shortName,
      type: this.mapEntityType(node.type),
      members: [],
      isImplicit: false,
      isAbstract: node.modifiers?.isAbstract || false,
      isStatic: node.modifiers?.isStatic || false,
      isActive: node.modifiers?.isActive || false,
      isLeaf: node.modifiers?.isLeaf || false,
      isFinal: node.modifiers?.isFinal || false,
      isRoot: node.modifiers?.isRoot || false,
      typeParameters: node.typeParameters,
      docs: node.docs,
      line: node.line,
      column: node.column,
      namespace: entityNamespace,
    }
  }

  /**
   * Builds an IREntity from an AssociationClassNode.
   */
  public buildAssociationClass(node: AssociationClassNode, namespace: string): IREntity {
    const fqn = FQNBuilder.build(node.name, namespace)
    const { name: shortName, namespace: entityNamespace } = FQNBuilder.split(fqn)

    return {
      id: fqn,
      name: shortName,
      type: IREntityType.CLASS,
      members: [],
      isImplicit: false,
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      docs: node.docs,
      line: node.line,
      column: node.column,
      namespace: entityNamespace,
    }
  }

  /**
   * Processes and fills the members of an already registered entity.
   */
  public processMembers(entity: IREntity, node: EntityNode): void {
    entity.members = this.mapMembers(node.body ?? [], entity.namespace || '')
  }

  /**
   * Appends members to an already registered entity.
   */
  public appendMembers(entity: IREntity, members: MemberNode[]): void {
    const newMembers = this.mapMembers(members ?? [], entity.namespace || '')
    entity.members.push(...newMembers)
  }

  /**
   * Processes members for an AssociationClass.

   */
  public processAssociationClassMembers(entity: IREntity, node: AssociationClassNode): void {
    entity.members = this.mapMembers(node.body ?? [], entity.namespace || '')
  }

  private mapEntityType(type: ASTNodeType): IREntityType {
    switch (type) {
      case ASTNodeType.INTERFACE:
        return IREntityType.INTERFACE
      case ASTNodeType.ENUM:
        return IREntityType.ENUM
      default:
        return IREntityType.CLASS
    }
  }

  private mapMembers(members: MemberNode[], namespace: string): IRMember[] {
    const seenNames = new Set<string>()

    return members
      .filter((m) => m.type !== 'Comment')
      .map((m) => {
        if (seenNames.has(m.name)) {
          this.context.addError(
            `Duplicate member: '${m.name}' is already defined in this entity.`,
            { line: m.line, column: m.column, type: TokenType.UNKNOWN, value: '' } as Token,
            DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
          )
        } else {
          seenNames.add(m.name)
        }

        const isMethod = m.type === ASTNodeType.METHOD
        const isAttribute = m.type === ASTNodeType.ATTRIBUTE

        const relationshipKind = isAttribute
          ? (m as AttributeNode).relationshipKind
          : (m as MethodNode).returnRelationshipKind

        const typeName =
          (m as AttributeNode).typeAnnotation?.raw || (m as MethodNode).returnType?.raw
        if (typeName) {
          this.validateMemberType(typeName, namespace, m)
        }

        const irMember: IRMember = {
          name: m.name,
          type: typeName,
          visibility: this.mapVisibility(m.visibility),
          isStatic: (m as AttributeNode | MethodNode).modifiers?.isStatic || false,
          isAbstract: isMethod ? (m as MethodNode).modifiers?.isAbstract || false : false,
          isLeaf: (m as AttributeNode | MethodNode).modifiers?.isLeaf || false,
          isFinal: (m as AttributeNode | MethodNode).modifiers?.isFinal || false,
          parameters: isMethod
            ? (m as MethodNode).parameters?.map((p) => ({
                name: p.name,
                type: p.typeAnnotation?.raw,
                relationshipKind: p.relationshipKind,
                isNavigable: p.isNavigable,
                targetModifiers: p.targetModifiers,
                constraints: p.constraints?.map((c: ConstraintNode) =>
                  this.constraintAnalyzer.process(c),
                ),
              }))
            : undefined,
          relationshipKind,
          isNavigable: isAttribute
            ? (m as AttributeNode).isNavigable
            : (m as MethodNode).isNavigable,
          targetModifiers: isAttribute
            ? (m as AttributeNode).targetModifiers
            : isMethod
              ? (m as MethodNode).returnTargetModifiers
              : undefined,
          multiplicity: isAttribute ? (m as AttributeNode).multiplicity : undefined,
          docs: m.docs,
          line: m.line,
          column: m.column,
          constraints: (m as AttributeNode | MethodNode).constraints?.map((c: ConstraintNode) =>
            this.constraintAnalyzer.process(c),
          ),
        }

        if (isAttribute && (m as AttributeNode).multiplicity) {
          MultiplicityValidator.validateBounds(
            (m as AttributeNode).multiplicity!,
            m.line,
            m.column,
            this.context,
          )
        }

        return irMember
      })
  }

  private validateMemberType(typeName: string, namespace: string, node: MemberNode): void {
    if (TypeValidator.isPrimitive(typeName)) return

    const modifiers =
      node.type === ASTNodeType.ATTRIBUTE
        ? (node as AttributeNode).targetModifiers
        : node.type === ASTNodeType.METHOD
          ? (node as MethodNode).returnTargetModifiers
          : undefined

    const baseType = TypeValidator.getBaseTypeName(typeName)
    const result = this.symbolTable.resolveOrRegisterImplicit(baseType, namespace, modifiers)

    if (result.isAmbiguous) {
      this.context.addError(
        `Ambiguity detected: '${baseType}' matches multiple entities.`,
        { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
        DiagnosticCode.SEMANTIC_AMBIGUOUS_ENTITY,
      )
    }

    // Silently register the implicit entity if it does not exist.
    // We don't report diagnostics (neither error nor info) because inline declaration is a strength of the DSL.
  }

  private mapVisibility(v: string): IRVisibility {
    switch (v?.toLowerCase()) {
      case '-':
      case 'private':
        return IRVisibility.PRIVATE
      case '#':
      case 'protected':
        return IRVisibility.PROTECTED
      case '~':
      case 'internal':
      case 'package':
        return IRVisibility.INTERNAL
      default:
        return IRVisibility.PUBLIC
    }
  }
}
