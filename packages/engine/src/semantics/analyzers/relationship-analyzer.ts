import type { IRRelationship } from '../../generator/ir/models'
import { IRRelationshipType, IREntityType } from '../../generator/ir/models'
import { TypeInferrer } from './type-inferrer'
import { registerDefaultInferenceRules } from '../rules/inference-rules'
import type { SymbolTable } from '../symbol-table'
import type { ParserContext } from '../../parser/parser.context'
import { DiagnosticCode } from '../../parser/diagnostic.types'
import type { HierarchyValidator } from '../validators/hierarchy-validator'
import type { RelationshipNode } from '../../parser/ast/nodes'
import { MultiplicityValidator } from '../utils/multiplicity-validator'
import { TokenType } from '../../lexer/token.types'
import type { Token } from '../../lexer/token.types'

/**
 * Handles creation and validation of relationships.
 */
export class RelationshipAnalyzer {
  private readonly typeInferrer: TypeInferrer

  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly relationships: IRRelationship[],
    private readonly hierarchyValidator: HierarchyValidator,
    private readonly context?: ParserContext,
  ) {
    this.typeInferrer = new TypeInferrer()
    registerDefaultInferenceRules(this.typeInferrer)
  }

  /**
   * Resolves a target entity and registers it as implicit if missing.
   * Can optionally infer the target type based on the source entity and relationship.
   */
  public resolveOrRegisterImplicit(
    name: string,
    namespace: string,
    modifiers?: { isAbstract?: boolean; isStatic?: boolean; isActive?: boolean },
    line?: number,
    column?: number,
    inferenceContext?: { sourceType: IREntityType; relationshipKind: IRRelationshipType },
  ): string {
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

    const result = this.symbolTable.resolveOrRegisterImplicit(
      name,
      namespace,
      modifiers,
      expectedType,
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
   * Adds a relationship to the IR.
   */
  public addRelationship(
    fromFQN: string,
    toFQN: string,
    kind: string,
    node?: RelationshipNode,
  ): void {
    const fromEntity = this.symbolTable.get(fromFQN)
    const toEntity = this.symbolTable.get(toFQN)
    const relType = this.mapRelationshipType(kind)

    if (fromEntity != null && toEntity != null) {
      this.hierarchyValidator.validateRelationship(fromEntity, toEntity, relType)
    } else {
      // Validate that both exist or report if they are effectively missing
    }

    const irRel: IRRelationship = {
      from: fromFQN,
      to: toFQN,
      type: relType,
      line: node?.line,
      column: node?.column,
      docs: node?.docs,
    }

    if (node != null) {
      if (node.fromMultiplicity) {
        irRel.fromMultiplicity = node.fromMultiplicity
        const bounds = MultiplicityValidator.validateBounds(
          node.fromMultiplicity,
          node.line,
          node.column,
          this.context,
        )

        // Composite Aggregation: Part's owner (whole) multiplicity cannot be > 1
        if (relType === IRRelationshipType.COMPOSITION && bounds && bounds.upper > 1) {
          this.context?.addError(
            `Composition Violation: An object cannot be part of more than one composite at the same time (upper multiplicity > 1 on container end).`,
            {
              line: node.line,
              column: node.column,
              type: TokenType.UNKNOWN,
              value: node.fromMultiplicity,
            } as Token,
            DiagnosticCode.SEMANTIC_COMPOSITE_VIOLATION,
          )
        }
      }
      if (node.toMultiplicity) {
        irRel.toMultiplicity = node.toMultiplicity
        MultiplicityValidator.validateBounds(
          node.toMultiplicity,
          node.line,
          node.column,
          this.context,
        )
      }
      if (node.label) irRel.label = node.label
    }

    this.relationships.push(irRel)
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
    if (['>*', 'comp', 'composition'].includes(k)) {
      return IRRelationshipType.COMPOSITION
    }

    // Aggregation (>+)
    // Note: The lexer token for aggregation is >+ but some legacy code might check >o.
    // We strictly follow the DSL: >+
    if (['>+', 'agreg', 'aggregation'].includes(k)) {
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

    // Bidirectional Association (<>)
    if (['<>', 'bidir', 'bidirectional'].includes(k)) {
      return IRRelationshipType.BIDIRECTIONAL
    }

    // Default fallback
    return IRRelationshipType.ASSOCIATION
  }
}
