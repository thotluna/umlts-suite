import {
  IRRelationshipType,
  IREntityType,
  IRVisibility,
  type IRRelationship,
  type IRConstraint,
  type IREntity,
  type IRMultiplicity,
} from '@engine/generator/ir/models'
import { TypeInferrer } from '@engine/semantics/analyzers/type-inferrer'
import { registerDefaultInferenceRules } from '@engine/semantics/rules/inference-rules'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import type { HierarchyValidator } from '@engine/semantics/validators/hierarchy-validator'
import { AssociationValidator } from '@engine/semantics/validators/association-validator'
import { ASTNodeType } from '@engine/syntax/nodes'
import { TypeValidator } from '@engine/semantics/utils/type-validator'
import type {
  RelationshipNode,
  RelationshipHeaderNode,
  ASTNode,
  Modifiers,
} from '@engine/syntax/nodes'
import { MultiplicityValidator } from '@engine/semantics/utils/multiplicity-validator'
import { TokenType } from '@engine/syntax/token.types'
import type { Token } from '@engine/syntax/token.types'
import type { ITypeResolutionStrategy } from '@engine/semantics/inference/type-resolution.pipeline'

/**
 * Handles creation and validation of relationships.
 */
export class RelationshipAnalyzer {
  private readonly typeInferrer: TypeInferrer
  private readonly associationValidator: AssociationValidator

  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly relationships: IRRelationship[],
    private readonly hierarchyValidator: HierarchyValidator,
    private readonly typePipeline: ITypeResolutionStrategy,
    private readonly context?: ISemanticContext,
  ) {
    this.typeInferrer = new TypeInferrer()
    registerDefaultInferenceRules(this.typeInferrer)
    this.associationValidator = new AssociationValidator(context!)
  }

  public getContext(): ISemanticContext | undefined {
    return this.context
  }

  /**
   * Resolves a target entity and registers it as implicit if missing.
   * Can optionally infer the target type based on the source entity and relationship.
   */
  public resolveOrRegisterImplicit(
    name: string,
    namespace: string,
    modifiers?: Modifiers,
    line?: number,
    column?: number,
    inferenceContext?: { sourceType: IREntityType; relationshipKind: IRRelationshipType },
    typeParameters?: string[],
    literals?: string[],
  ): string {
    // If it's a generic parameter of the current context, we treat it as a "virtual" entity
    // that won't be registered in the symbol table to avoid orphan boxes.
    const baseName = TypeValidator.getBaseTypeName(name)
    if (typeParameters?.includes(baseName) || this.typePipeline.isPrimitive(baseName)) {
      return baseName // Return as-is, won't be found in SymbolTable, won't be rendered as a box
    }

    let expectedType = IREntityType.CLASS

    if (inferenceContext) {
      const inferred = this.typeInferrer.infer(
        inferenceContext.sourceType,
        inferenceContext.relationshipKind,
      )

      if (inferred) {
        expectedType = inferred
      } else {
        // Fallback to CLASS but report error strictly as requested
        expectedType = IREntityType.CLASS
        this.context?.addError(
          `Cannot infer implicit entity type for relationship '${inferenceContext.relationshipKind}' from '${inferenceContext.sourceType}'. Defaulting target '${name}' to CLASS.`,
          { line, column, type: TokenType.UNKNOWN, value: '' } as Token,
          DiagnosticCode.SEMANTIC_INVALID_TYPE,
        )
      }
    }

    if (literals && literals.length > 0) {
      expectedType = IREntityType.ENUMERATION
    }

    const result = this.symbolTable.resolveOrRegisterImplicit(
      name,
      namespace,
      modifiers,
      expectedType,
      literals,
    )

    if (result.isAmbiguous) {
      this.context?.addError(
        `Ambiguity detected: '${name}' matches multiple entities: ${result.candidates?.join(
          ', ',
        )}. Please use the qualified name.`,
        { line, column, type: TokenType.UNKNOWN, value: '' } as Token,
        DiagnosticCode.SEMANTIC_AMBIGUOUS_ENTITY,
      )
    }

    // Silent registration of implicit entities

    return result.fqn
  }

  /**
   * Adds a relationship to the IR using a pre-resolved relationship type.
   * Useful for inferred relationships from attributes/methods.
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
