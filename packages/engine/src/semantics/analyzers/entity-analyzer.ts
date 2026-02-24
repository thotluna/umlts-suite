import type { IREntity, IRMultiplicity } from '@engine/generator/ir/models'
import { IREntityType, IRVisibility } from '@engine/generator/ir/models'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConfigStore } from '@engine/semantics/session/config-store'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { TypeValidator } from '@engine/semantics/utils/type-validator'
import { FQNBuilder } from '@engine/semantics/utils/fqn-builder'
import { MultiplicityValidator } from '@engine/semantics/utils/multiplicity-validator'
import { TokenType } from '@engine/syntax/token.types'
import type { Token } from '@engine/syntax/token.types'

import type {
  EntityNode,
  MemberNode,
  AttributeNode,
  MethodNode,
  AssociationClassNode,
} from '@engine/syntax/nodes'
import { ASTNodeType } from '@engine/syntax/nodes'
import type { ConstraintAnalyzer } from '@engine/semantics/analyzers/constraint-analyzer'

/**
 * Handles the declaration of entities and their members.
 */
export class EntityAnalyzer {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly constraintAnalyzer: ConstraintAnalyzer,
    private readonly context: ISemanticContext,
    private readonly configStore: ConfigStore,
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
      properties: [],
      operations: [],
      isImplicit: false,
      isAbstract: node.modifiers?.isAbstract || false,
      isActive: node.modifiers?.isActive || false,
      isLeaf: node.modifiers?.isLeaf || false,
      isFinal: node.modifiers?.isFinal || false,
      isRoot: node.modifiers?.isRoot || false,
      isStatic: node.modifiers?.isStatic || false,
      typeParameters: node.typeParameters || [],
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
      type: IREntityType.ASSOCIATION_CLASS,
      properties: [],
      operations: [],
      isImplicit: false,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
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
    const keepAsClass = (node.relationships || []).some((r) => {
      const k = r.kind.toLowerCase().trim()
      return (
        ['>i', 'implements', 'implement'].includes(k) || ['>>', 'extends', 'extend'].includes(k)
      )
    })
    this.fillMembers(
      entity,
      node.body ?? [],
      entity.namespace || '',
      entity.typeParameters,
      keepAsClass,
    )
  }

  /**
   * Appends members to an already registered entity.
   */
  public appendMembers(entity: IREntity, members: MemberNode[]): void {
    this.fillMembers(entity, members ?? [], entity.namespace || '', entity.typeParameters)
  }

  /**
   * Processes members for an AssociationClass.
   */
  public processAssociationClassMembers(entity: IREntity, node: AssociationClassNode): void {
    this.fillMembers(entity, node.body ?? [], entity.namespace || '')
  }

  private mapEntityType(type: ASTNodeType): IREntityType {
    switch (type) {
      case ASTNodeType.INTERFACE:
        return IREntityType.INTERFACE
      case ASTNodeType.ENUM:
        return IREntityType.ENUMERATION
      default:
        return IREntityType.CLASS
    }
  }

  private fillMembers(
    entity: IREntity,
    members: MemberNode[],
    namespace: string,
    typeParameters?: string[],
    keepAsClass: boolean = false,
  ): void {
    if (!entity.properties) entity.properties = []
    if (!entity.operations) entity.operations = []

    const seenNames = new Set<string>()

    ;(members || [])
      .filter(
        (m) =>
          m.type !== ASTNodeType.COMMENT &&
          m.type !== ASTNodeType.CONSTRAINT &&
          m.type !== ASTNodeType.NOTE,
      )
      .forEach((m) => {
        const namedMember = m as AttributeNode | MethodNode
        if (seenNames.has(namedMember.name)) {
          this.context.addError(
            `Duplicate member: '${namedMember.name}' is already defined in this entity.`,
            { line: m.line, column: m.column, type: TokenType.UNKNOWN, value: '' } as Token,
            DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
          )
        } else {
          seenNames.add(namedMember.name)
        }

        if (m.type === ASTNodeType.ATTRIBUTE) {
          const attr = m as AttributeNode

          if (entity.type === IREntityType.ENUMERATION) {
            if (!entity.literals) entity.literals = []
            entity.literals.push({
              name: attr.name,
              docs: attr.docs,
            })
            return
          }

          const multiplicity = attr.multiplicity
            ? this.processMultiplicity(attr.multiplicity, attr.line, attr.column)
            : undefined

          entity.properties.push({
            name: attr.name,
            type: this.processType(attr.typeAnnotation?.raw),
            visibility: this.mapVisibility(attr.visibility),
            isStatic: attr.modifiers?.isStatic || false,
            isReadOnly: attr.modifiers?.isFinal || false,
            isLeaf: attr.modifiers?.isLeaf || false,
            multiplicity,
            isOrdered: false,
            isUnique: true,
            aggregation: this.mapAggregation(attr.relationshipKind),
            label: attr.label,
            line: attr.line,
            column: attr.column,
            docs: attr.docs,
            constraints: attr.constraints?.map((c) => this.constraintAnalyzer.process(c)),
          })
        } else if (m.type === ASTNodeType.METHOD) {
          const meth = m as MethodNode
          this.validateMemberType(meth.returnType?.raw, namespace, m, typeParameters)

          entity.operations.push({
            name: meth.name,
            visibility: this.mapVisibility(meth.visibility),
            isStatic: meth.modifiers?.isStatic || false,
            isAbstract: meth.modifiers?.isAbstract || false,
            isLeaf: meth.modifiers?.isLeaf || meth.modifiers?.isFinal || false,
            isQuery: false,
            parameters: (meth.parameters || []).map((p) => ({
              name: p.name,
              type: this.processType(p.typeAnnotation?.raw),
              multiplicity: p.multiplicity
                ? this.processMultiplicity(p.multiplicity, p.line, p.column)
                : undefined,
              direction: 'in' as const,
              relationshipKind: p.relationshipKind,
              modifiers: p.targetModifiers
                ? {
                    isAbstract: p.targetModifiers.isAbstract || false,
                    isStatic: p.targetModifiers.isStatic || false,
                    isActive: p.targetModifiers.isActive || false,
                    isLeaf: p.targetModifiers.isLeaf || false,
                    isFinal: p.targetModifiers.isFinal || false,
                    isRoot: p.targetModifiers.isRoot || false,
                  }
                : undefined,
              line: p.line,
              column: p.column,
            })),
            returnType: this.processType(meth.returnType?.raw),
            line: meth.line,
            column: meth.column,
            docs: meth.docs,
            constraints: (meth.constraints || []).map((c) => this.constraintAnalyzer.process(c)),
          })
        }
      })

    // Manual Reversion to Class if explicitly requested via Relationships (e.g. >> or >I)
    if (keepAsClass && entity.type === IREntityType.DATA_TYPE) {
      entity.type = IREntityType.CLASS
    }
  }

  private mapAggregation(kind?: string): 'none' | 'shared' | 'composite' {
    switch (kind) {
      case '>*':
        return 'composite'
      case '>+':
        return 'shared'
      default:
        return 'none'
    }
  }

  private validateMemberType(
    typeName: string | undefined,
    namespace: string,
    node: MemberNode,
    typeParameters?: string[],
  ): void {
    if (!typeName) return
    if (TypeValidator.isPrimitive(typeName)) return
    if (node.type === ASTNodeType.CONSTRAINT || node.type === ASTNodeType.NOTE) return

    const baseType = TypeValidator.getBaseTypeName(typeName)
    if (TypeValidator.isPrimitive(baseType)) return
    if (typeParameters?.includes(baseType)) return

    const modifiers =
      node.type === ASTNodeType.ATTRIBUTE
        ? (node as AttributeNode).targetModifiers
        : node.type === ASTNodeType.METHOD
          ? (node as MethodNode).returnTargetModifiers
          : undefined

    this.symbolTable.resolveOrRegisterImplicit(baseType, namespace, modifiers)
  }

  private processType(typeName?: string): string | undefined {
    return typeName
  }

  private processMultiplicity(
    multiplicity: string,
    line?: number,
    column?: number,
  ): IRMultiplicity | undefined {
    const bounds = MultiplicityValidator.validateBounds(multiplicity, line, column, this.context)
    if (!bounds) return undefined
    return {
      lower: bounds.lower,
      upper: bounds.upper === Infinity ? '*' : bounds.upper,
    }
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
        return IRVisibility.PACKAGE
      default:
        return IRVisibility.PUBLIC
    }
  }
}
