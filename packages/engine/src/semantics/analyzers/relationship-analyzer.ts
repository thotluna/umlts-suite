import type { IRRelationship } from '../../generator/ir/models'
import { IRRelationshipType } from '../../generator/ir/models'
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
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly relationships: IRRelationship[],
    private readonly hierarchyValidator: HierarchyValidator,
    private readonly context?: ParserContext,
  ) {}

  /**
   * Resolves a target entity and registers it as implicit if missing.
   */
  public resolveOrRegisterImplicit(
    name: string,
    namespace: string,
    modifiers?: { isAbstract?: boolean; isStatic?: boolean; isActive?: boolean },
    line?: number,
    column?: number,
  ): string {
    const result = this.symbolTable.resolveOrRegisterImplicit(name, namespace, modifiers)

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

    // Inheritance symbols/keywords
    if (['extend', 'extends', '<|--', '--|>', '>>'].includes(k)) {
      return IRRelationshipType.INHERITANCE
    }

    // Implementation symbols/keywords
    if (['implement', 'implements', '..|>', '<|..', '>i'].includes(k)) {
      return IRRelationshipType.IMPLEMENTATION
    }

    // Composition
    if (['*', 'o', '*--', '--*', '>*'].includes(k)) {
      return IRRelationshipType.COMPOSITION
    }

    // Aggregation
    if (['o--', '--o', '>o'].includes(k)) {
      return IRRelationshipType.AGGREGATION
    }

    // Realization
    if (['realize', 'realizes'].includes(k)) {
      return IRRelationshipType.REALIZATION
    }

    // Dependency (lowest priority if symbols overlap)
    if (['-->', '<<', '>-', '>use'].includes(k)) {
      return IRRelationshipType.DEPENDENCY
    }

    return IRRelationshipType.ASSOCIATION
  }
}
