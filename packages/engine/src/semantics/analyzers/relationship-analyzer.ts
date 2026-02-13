import type { IRRelationship, IREntity } from '../../generator/ir/models'
import { IRRelationshipType, IREntityType } from '../../generator/ir/models'
import type { SymbolTable } from '../symbol-table'
import type { ParserContext } from '../../parser/parser.context'
import { DiagnosticCode } from '../../parser/diagnostic.types'
import { FQNBuilder } from '../utils/fqn-builder'
import type { HierarchyValidator } from '../validators/hierarchy-validator'
import type { RelationshipNode } from '../../parser/ast/nodes'

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
  ): string {
    const baseName = name.includes('<') ? name.substring(0, name.indexOf('<')) : name
    const fqn = this.symbolTable.resolveFQN(baseName, namespace)
    const existing = this.symbolTable.get(fqn)

    if (existing == null) {
      const { name: shortName, namespace: entityNamespace } = FQNBuilder.split(fqn)

      this.context?.addError(
        `Entidad implícita detectada: '${shortName}' no está definida explícitamente.`,
        undefined,
        DiagnosticCode.SEMANTIC_IMPLICIT_ENTITY,
      )
      // Change severity to warning if needed, but for now we follow the feedback of "warning the user"
      // Actually our DiagnosticSeverity is currently fixed in addError, we might need to adjust it.

      const entity: IREntity = {
        id: fqn,
        name: shortName,
        type: IREntityType.CLASS,
        members: [],
        isImplicit: true,
        isAbstract: modifiers?.isAbstract || false,
        isStatic: modifiers?.isStatic || false,
        isActive: modifiers?.isActive || false,
        namespace: entityNamespace,
      }

      this.symbolTable.register(entity)
    }

    return fqn
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
      if (node.fromMultiplicity) irRel.fromMultiplicity = node.fromMultiplicity
      if (node.toMultiplicity) irRel.toMultiplicity = node.toMultiplicity
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
    if (['-->', '<<'].includes(k)) {
      return IRRelationshipType.DEPENDENCY
    }

    return IRRelationshipType.ASSOCIATION
  }
}
