import type { IREntity, IRMultiplicity } from '../../generator/ir/models'
import { PluginManager } from '../../plugins/plugin-manager'
import { IREntityType, IRVisibility } from '../../generator/ir/models'
import type { SymbolTable } from '../symbol-table'
import type { ConfigStore } from '../session/config-store'
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
    private readonly configStore: ConfigStore,
    private readonly pluginManager: PluginManager,
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
      .filter((m) => m.type !== ASTNodeType.COMMENT)
      .forEach((m) => {
        if (seenNames.has(m.name)) {
          this.context.addError(
            `Duplicate member: '${m.name}' is already defined in this entity.`,
            { line: m.line, column: m.column, type: TokenType.UNKNOWN, value: '' } as Token,
            DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
          )
        } else {
          seenNames.add(m.name)
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
            })),
            returnType: this.processType(meth.returnType?.raw),
            line: meth.line,
            column: meth.column,
            docs: meth.docs,
            constraints: (meth.constraints || []).map((c) => this.constraintAnalyzer.process(c)),
          })
        }
      })

    // UML Heuristic: Identity vs Value
    // ONLY for TypeScript: Classes or Interfaces without operations are considered DataTypes.
    // In other languages (or generic UML), we keep identity (Class/Interface) to allow sketching.
    const isTS = this.configStore.get().language === 'typescript'

    if (
      isTS &&
      entity.operations.length === 0 &&
      (entity.type === IREntityType.CLASS || entity.type === IREntityType.INTERFACE) &&
      !entity.isActive && // Active classes always have identity
      !keepAsClass
    ) {
      entity.type = IREntityType.DATA_TYPE
    }

    // Ensure we revert to Class if keepAsClass is manually requested or inferred
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
    typeName: string,
    namespace: string,
    node: MemberNode,
    typeParameters?: string[],
  ): void {
    if (TypeValidator.isPrimitive(typeName)) return

    // Consultar al plugin antes de registrar implícitamente
    // Si el plugin resuelve que es un tipo que se debe eliminar (ignorar), no lo registramos.
    const plugin = this.pluginManager.getActive()
    if (plugin) {
      const mapping = plugin.resolveType({
        type: ASTNodeType.TYPE,
        name: TypeValidator.getBaseTypeName(typeName),
        raw: typeName,
        kind: 'simple',
        line: 0,
        column: 0,
      })
      if (mapping?.targetName === '') return // Ignorar si el plugin lo marca como vacío (ej: void)

      const primitiveMapped = plugin.mapPrimitive(TypeValidator.getBaseTypeName(typeName))
      if (primitiveMapped === '') return // Ignorar si es un primitivo que se mapea a vacío
    }

    const baseType = TypeValidator.getBaseTypeName(typeName)
    if (typeParameters?.includes(baseType)) return

    const modifiers =
      node.type === ASTNodeType.ATTRIBUTE
        ? (node as AttributeNode).targetModifiers
        : node.type === ASTNodeType.METHOD
          ? (node as MethodNode).returnTargetModifiers
          : undefined

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

  private processType(typeName?: string): string | undefined {
    if (!typeName) return undefined

    const plugin = this.pluginManager.getActive()
    let result = typeName

    if (plugin) {
      // Map primitives (e.g., string -> String)
      const base = TypeValidator.getBaseTypeName(typeName)
      const mapped = plugin.mapPrimitive(base)
      if (mapped === '') return undefined // El plugin solicita explícitamente eliminar el tipo (ej: void)
      if (mapped) {
        result = typeName.replace(base, mapped)
      }
    }

    return result
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
