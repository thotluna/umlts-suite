import type { IREntity, IRMultiplicity } from '../../generator/ir/models'
import { PluginManager } from '../../plugins/plugin-manager'
import { IREntityType, IRVisibility } from '../../generator/ir/models'
import type { SymbolTable } from '../symbol-table'
import type { ConfigStore } from '../session/config-store'
import type { IParserHub } from '../../parser/parser.context'
import { DiagnosticCode } from '../../syntax/diagnostic.types'
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
} from '../../syntax/nodes'
import { ASTNodeType } from '../../syntax/nodes'
import type { ConstraintAnalyzer } from './constraint-analyzer'
import type { RelationshipAnalyzer } from './relationship-analyzer'

/**
 * Handles the declaration of entities and their members.
 */
export class EntityAnalyzer {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly constraintAnalyzer: ConstraintAnalyzer,
    private readonly context: IParserHub,
    private readonly configStore?: ConfigStore,
    private readonly pluginManager?: PluginManager,
  ) {}

  private relationshipAnalyzer: RelationshipAnalyzer | undefined

  public setRelationshipAnalyzer(analyzer: RelationshipAnalyzer): void {
    this.relationshipAnalyzer = analyzer
  }

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
    this.fillMembers(entity, node.body || [], keepAsClass)
  }

  /**
   * Appends members to an existing entity (from a deferred relationship body).
   */
  public appendMembers(entity: IREntity, members: MemberNode[]): void {
    this.fillMembers(entity, members, true)
  }

  /**
   * Processes members for an Association Class.
   */
  public processAssociationClassMembers(entity: IREntity, node: AssociationClassNode): void {
    this.fillMembers(entity, node.body || [], true)
  }

  private fillMembers(entity: IREntity, members: MemberNode[], keepAsClass: boolean): void {
    const memberNames = new Set<string>()

    members.forEach((member) => {
      // RULE: Detect duplicate members
      const memberName =
        member.type === ASTNodeType.ATTRIBUTE
          ? (member as AttributeNode).name
          : (member as MethodNode).name

      if (memberNames.has(memberName)) {
        const token: Token = {
          line: member.line || entity.line || 1,
          column: member.column || entity.column || 1,
          type: TokenType.IDENTIFIER,
          value: memberName,
        }
        this.context.addError(
          `Semantic Violation: Duplicate member '${memberName}' in entity '${entity.name}'.`,
          token,
          DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
        )
        return
      }
      memberNames.add(memberName)

      if (member.type === ASTNodeType.ATTRIBUTE) {
        const attr = member as AttributeNode

        // Si es un Enum, registramos como literal
        if (entity.type === IREntityType.ENUMERATION) {
          entity.literals = entity.literals || []
          entity.literals.push({
            name: attr.name,
            docs: attr.docs,
          })
        } else {
          // Si tiene un operador de relación, inferimos la relación
          if (attr.relationshipKind && this.relationshipAnalyzer) {
            this.relationshipAnalyzer.addRelationship(
              entity.id,
              attr.typeAnnotation.raw,
              attr.relationshipKind,
              attr,
            )
          }
          entity.properties.push(this.processAttribute(attr, entity))
        }
      } else if (member.type === ASTNodeType.METHOD) {
        const method = member as MethodNode
        // Inferencia en tipo de retorno
        if (method.returnRelationshipKind && method.returnType && this.relationshipAnalyzer) {
          this.relationshipAnalyzer.addRelationship(
            entity.id,
            method.returnType.raw,
            method.returnRelationshipKind,
            method,
          )
        }
        entity.operations.push(this.processMethod(method, entity))
      }
    })

    // If it has methods or relationships, it's definitely a Class/Interface, not a DataType
    if (!keepAsClass && entity.type === IREntityType.CLASS && entity.operations.length === 0) {
      // Potentially a DataType if it only has properties and no inheritance?
      // For now, only the SemanticAnalyzer refines this based on global relationship info
    }
  }

  private processAttribute(node: AttributeNode, _entity: IREntity) {
    const multiplicity = node.multiplicity
      ? this.parseMultiplicity(node.multiplicity, node.line, node.column)
      : undefined

    return {
      name: node.name,
      type: node.typeAnnotation.raw,
      visibility: (node.visibility as IRVisibility) || IRVisibility.PUBLIC,
      isStatic: node.modifiers?.isStatic || false,
      isReadOnly: node.modifiers?.isReadOnly || false,
      isLeaf: node.modifiers?.isLeaf || false,
      isOrdered: false,
      isUnique: true,
      aggregation: 'none' as const,
      multiplicity,
      docs: node.docs,
      line: node.line,
      column: node.column,
      constraints: node.constraints?.map((c) => this.constraintAnalyzer.process(c)),
    }
  }

  private processMethod(node: MethodNode, _entity: IREntity) {
    return {
      name: node.name,
      returnType: node.returnType?.raw || 'void',
      visibility: (node.visibility as IRVisibility) || IRVisibility.PUBLIC,
      isStatic: node.modifiers?.isStatic || false,
      isAbstract: node.modifiers?.isAbstract || false,
      isLeaf: node.modifiers?.isLeaf || false,
      isQuery: node.modifiers?.isQuery || false,
      parameters: (node.parameters || []).map((p) => ({
        name: p.name,
        type: p.typeAnnotation.raw,
        multiplicity: p.multiplicity
          ? this.parseMultiplicity(p.multiplicity, p.line, p.column)
          : undefined,
      })),
      docs: node.docs,
      line: node.line,
      column: node.column,
      constraints: node.constraints?.map((c) => this.constraintAnalyzer.process(c)),
    }
  }

  private parseMultiplicity(
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

  public mapEntityType(type: string): IREntityType {
    switch (type.toLowerCase()) {
      case 'interface':
        return IREntityType.INTERFACE
      case 'enum':
      case 'enumeration':
        return IREntityType.ENUMERATION
      case 'datatype':
        return IREntityType.DATA_TYPE
      case 'primitive':
        return IREntityType.PRIMITIVE_TYPE
      default:
        return IREntityType.CLASS
    }
  }
}
