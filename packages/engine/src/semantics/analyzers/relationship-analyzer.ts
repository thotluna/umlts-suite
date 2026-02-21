import {
  type IRRelationship,
  IRRelationshipType,
  IRVisibility,
  type IRMultiplicity,
  type IREntity,
  type IRConstraint,
} from '../../generator/ir/models'
import {
  type ASTNode,
  ASTNodeType,
  type RelationshipNode,
  type RelationshipHeaderNode,
} from '../../syntax/nodes'
import type { SymbolTable } from '../symbol-table'
import type { IParserHub } from '../../parser/parser.context'
import { DiagnosticCode } from '../../syntax/diagnostic.types'
import { TokenType, type Token } from '../../syntax/token.types'
import { MultiplicityValidator } from '../utils/multiplicity-validator'
import { TypeValidator } from '../utils/type-validator'
import type { HierarchyValidator } from '../validators/hierarchy-validator'
import { AssociationValidator } from '../validators/association-validator'

/**
 * Handles the declaration and resolution of relationships.
 */
export class RelationshipAnalyzer {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly relationships: IRRelationship[],
    private readonly hierarchyValidator: HierarchyValidator,
    private readonly context: IParserHub,
  ) {
    this.associationValidator = new AssociationValidator(context)
  }

  private readonly associationValidator: AssociationValidator

  /**
   * Directly adds an already resolved and validated relationship to the IR.
   */
  public addResolvedRelationship(
    fromFQN: string,
    toFQN: string,
    type: IRRelationshipType,
    meta: {
      line?: number
      column?: number
      label?: string
      toMultiplicity?: string
      fromMultiplicity?: string
      visibility?: IRVisibility
      associationClassId?: string
      isNavigable?: boolean
      constraintGroupId?: string
      constraints?: IRConstraint[]
      originalTarget?: string
      toName?: string
      fromName?: string
    },
  ): void {
    const fromEntity = this.symbolTable.get(fromFQN)
    const toEntity = this.symbolTable.get(toFQN)

    if (fromEntity != null && toEntity != null) {
      this.hierarchyValidator.validateRelationship(fromEntity, toEntity, type)
      this.associationValidator.validate(fromEntity, toEntity, type)
    }

    const isValidTarget = this.associationValidator.validateTarget(
      toFQN,
      type,
      this.symbolTable,
      meta.line,
      meta.column,
      toFQN.split('.').pop(), // Target name from FQN
    )

    if (!isValidTarget) return

    let finalLabel = meta.label
    if (meta.originalTarget && toEntity) {
      const bindingLabel = this.extractBindingLabel(meta.originalTarget, toEntity)
      if (bindingLabel) {
        finalLabel = finalLabel ? `${finalLabel}\n${bindingLabel}` : bindingLabel
      }
    }

    const irRel: IRRelationship = {
      from: fromFQN,
      to: toFQN,
      type,
      line: meta.line,
      column: meta.column,
      label: finalLabel,
      toMultiplicity: meta.toMultiplicity
        ? this.parseMultiplicity(meta.toMultiplicity, meta.line, meta.column)
        : undefined,
      fromMultiplicity: meta.fromMultiplicity
        ? this.parseMultiplicity(meta.fromMultiplicity, meta.line, meta.column)
        : undefined,
      toName: meta.toName,
      fromName: meta.fromName,
      visibility: meta.visibility || IRVisibility.PUBLIC,
      associationClassId: meta.associationClassId,
      isNavigable: meta.isNavigable ?? true,
      constraints:
        meta.constraints?.map((c) => (c.kind === 'xor' ? { ...c, kind: 'xor_member' } : c)) ||
        (meta.constraintGroupId
          ? [{ kind: 'xor_member', targets: [meta.constraintGroupId] }]
          : undefined),
    }

    this.relationships.push(irRel)
  }

  /**
   * Adds a relationship to the IR.
   */
  public addRelationship(
    fromFQN: string,
    toFQN: string,
    kind: string,
    node?: ASTNode,
    constraintGroupId?: string,
  ): void {
    const relType = this.mapRelationshipType(kind)

    // Extract target name for length calculation
    let targetName = toFQN.split('.').pop()
    let originalTarget = ''
    if (node != null && node.type === ASTNodeType.RELATIONSHIP) {
      if ('to' in node) {
        targetName = (node as RelationshipNode).to
        originalTarget = (node as RelationshipNode).to
      }
      if ('target' in node) {
        targetName = (node as RelationshipHeaderNode).target
        originalTarget = (node as RelationshipHeaderNode).target
      }
    }

    const isValidTarget = this.associationValidator.validateTarget(
      toFQN,
      relType,
      this.symbolTable,
      node?.line,
      node?.column,
      targetName,
    )

    if (!isValidTarget) return // Abort

    const fromEntity = this.symbolTable.get(fromFQN)
    const toEntity = this.symbolTable.get(toFQN)

    if (fromEntity != null && toEntity != null) {
      this.hierarchyValidator.validateRelationship(fromEntity, toEntity, relType)
      this.associationValidator.validate(fromEntity, toEntity, relType)
    }

    let finalLabel: string | undefined
    if (originalTarget && toEntity) {
      finalLabel = this.extractBindingLabel(originalTarget, toEntity)
    }

    const irRel: IRRelationship = {
      from: fromFQN,
      to: toFQN,
      type: relType,
      line: node?.line,
      column: node?.column,
      docs: node?.docs,
      label: finalLabel,
      isNavigable: (node as RelationshipNode | RelationshipHeaderNode)?.isNavigable ?? true,
      constraints: constraintGroupId
        ? [{ kind: 'xor_member', targets: [constraintGroupId] }]
        : undefined,
    }

    if (node != null && 'fromMultiplicity' in node) {
      const relNode = node as RelationshipNode
      if (relNode.fromMultiplicity) {
        const bounds = MultiplicityValidator.validateBounds(
          relNode.fromMultiplicity,
          relNode.line,
          relNode.column,
          this.context,
        )

        if (bounds) {
          irRel.fromMultiplicity = {
            lower: bounds.lower,
            upper: bounds.upper === Infinity ? '*' : bounds.upper,
          }

          if (relType === IRRelationshipType.COMPOSITION && bounds.upper > 1) {
            const errorToken: Token = {
              line: relNode.line || 1,
              column: relNode.column || 1,
              type: TokenType.UNKNOWN,
              value: relNode.fromMultiplicity,
            }
            this.context?.addError(
              `Composition Violation: An object cannot be part of more than one composite at the same time (upper multiplicity > 1 on container end).`,
              errorToken,
              DiagnosticCode.SEMANTIC_COMPOSITE_VIOLATION,
            )
          }
        }
      }
      if (relNode.toMultiplicity) {
        irRel.toMultiplicity = this.parseMultiplicity(
          relNode.toMultiplicity,
          relNode.line,
          relNode.column,
        )
      }
      if (relNode.label) {
        // If binding label exists, combine them
        irRel.label = irRel.label ? `${relNode.label}\n${irRel.label}` : relNode.label
      }
    }

    this.relationships.push(irRel)
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

  private extractBindingLabel(targetStr: string, entity: IREntity): string | undefined {
    const decomposed = TypeValidator.decomposeGeneric(targetStr)
    if (decomposed.args.length === 0) return undefined

    const params = entity.typeParameters || []
    const mapping = decomposed.args
      .map((arg: string, i: number) => {
        const paramName = params[i] || `P${i + 1}`
        if (arg === paramName) return null
        return `${paramName} -> ${arg}`
      })
      .filter((m): m is string => m !== null)

    if (mapping.length === 0) return undefined

    return `«bind» <${mapping.join(', ')}>`
  }

  public mapRelationshipType(kind: string): IRRelationshipType {
    const k = kind.toLowerCase().trim()

    // Inheritance (>>)
    if (['>>', 'extends', 'extend'].includes(k)) {
      return IRRelationshipType.INHERITANCE
    }

    // Implementation (>I)
    if (['>i', 'implements', 'implement'].includes(k)) {
      return IRRelationshipType.IMPLEMENTATION
    }

    // Composition (>*)
    if (['>*', '>*|', 'comp', 'composition'].includes(k)) {
      return IRRelationshipType.COMPOSITION
    }

    // Aggregation (>+)
    // Note: The lexer token for aggregation is >+ but some legacy code might check >o.
    // We strictly follow the DSL: >+
    if (['>+', '>+|', 'agreg', 'aggregation'].includes(k)) {
      return IRRelationshipType.AGGREGATION
    }

    // Association (><)
    if (['><', 'assoc', 'association'].includes(k)) {
      return IRRelationshipType.ASSOCIATION
    }

    // Usage/Dependency (>-, >use)
    if (['>-', '>use', 'use', 'dependency'].includes(k)) {
      return IRRelationshipType.DEPENDENCY
    }

    // Realization (Internal concept, typically mapped from Implements but kept for safety)
    if (['realize', 'realizes'].includes(k)) {
      return IRRelationshipType.REALIZATION
    }

    // Bidirectional/Undirected Association (>)
    if (['>', '<>', 'bidir', 'bidirectional'].includes(k)) {
      return IRRelationshipType.BIDIRECTIONAL
    }

    // Default fallback
    return IRRelationshipType.ASSOCIATION
  }
}
