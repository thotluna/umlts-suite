import type { IRMember, IREntity } from '../../generator/ir/models'
import { IREntityType, IRVisibility } from '../../generator/ir/models'
import type { SymbolTable } from '../symbol-table'
import type { ParserContext } from '../../parser/parser.context'
import { DiagnosticCode } from '../../parser/diagnostic.types'
import { TypeValidator } from '../utils/type-validator'
import { FQNBuilder } from '../utils/fqn-builder'
import { TokenType } from '../../lexer/token.types'
import type { Token } from '../../lexer/token.types'
import type { EntityNode, MemberNode, AttributeNode, MethodNode } from '../../parser/ast/nodes'
import { ASTNodeType } from '../../parser/ast/nodes'

/**
 * Handles the declaration of entities and their members.
 */
export class EntityAnalyzer {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly context: ParserContext,
  ) {}

  /**
   * Builds an IREntity from an EntityNode.
   */
  public buildEntity(node: EntityNode, namespace: string): IREntity {
    const fqn = FQNBuilder.build(node.name, namespace)
    const { name: shortName, namespace: entityNamespace } = FQNBuilder.split(fqn)

    return {
      id: fqn,
      name: shortName,
      type: this.mapEntityType(node.type),
      members: this.mapMembers(node.body != null || [], entityNamespace || ''),
      isImplicit: false,
      isAbstract: node.isAbstract || false,
      isStatic: node.isStatic || false,
      isActive: node.isActive || false,
      typeParameters: node.typeParameters,
      docs: node.docs,
      line: node.line,
      column: node.column,
      namespace: entityNamespace,
    }
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
            `Miembro duplicado: '${m.name}' ya está definido en esta entidad.`,
            { line: m.line, column: m.column, type: TokenType.UNKNOWN, value: '' } as Token,
            DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
          )
        } else {
          seenNames.add(m.name)
        }

        const typeName =
          (m as AttributeNode).typeAnnotation?.raw || (m as MethodNode).returnType?.raw
        if (typeName) {
          this.validateMemberType(typeName, namespace, m)
        }

        const isMethod = m.type === ASTNodeType.METHOD
        const isAttribute = m.type === ASTNodeType.ATTRIBUTE

        return {
          name: m.name,
          type: typeName,
          visibility: this.mapVisibility(m.visibility),
          isStatic: m.isStatic || false,
          isAbstract: isMethod ? m.isAbstract : false,
          parameters: isMethod
            ? m.parameters?.map((p) => ({
                name: p.name,
                type: p.typeAnnotation?.raw,
                relationshipKind: p.relationshipKind,
              }))
            : [],
          relationshipKind: isAttribute ? m.relationshipKind : m.returnRelationshipKind,
          multiplicity: isAttribute ? m.multiplicity : undefined,
          docs: m.docs,
          line: m.line,
          column: m.column,
        }
      })
  }

  private validateMemberType(typeName: string, namespace: string, node: MemberNode): void {
    if (TypeValidator.isPrimitive(typeName)) return

    const baseType = TypeValidator.getBaseTypeName(typeName)
    const fqn = this.symbolTable.resolveFQN(baseType, namespace)

    if (!this.symbolTable.has(fqn)) {
      // If it's not known, it could be an implicit entity or an error.
      // But here we just check if it's a valid reference.
      // The feedback suggested validating attributes.
      this.context.addError(
        `Tipo no resuelto: '${baseType}' no es un tipo primitivo ni una entidad conocida.`,
        { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
        DiagnosticCode.SEMANTIC_INVALID_TYPE,
      )
    }
  }

  private mapVisibility(v: string): IRVisibility {
    switch (v) {
      case '-':
        return IRVisibility.PRIVATE
      case '#':
        return IRVisibility.PROTECTED
      case '~':
        return IRVisibility.INTERNAL
      default:
        return IRVisibility.PUBLIC
    }
  }
}
