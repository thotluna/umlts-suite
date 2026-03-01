import type { IREntity, IRRelationship } from '@engine/generator/ir/models'
import { IRRelationshipType, IREntityType } from '@engine/generator/ir/models'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import { TokenType } from '@engine/syntax/token.types'
import type { Token } from '@engine/syntax/token.types'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'

/**
 * Validator for hierarchy-related rules (cycles, inheritance consistency).
 */
export class HierarchyValidator {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly context: ISemanticContext,
  ) {}

  /**
   * Validates internal consistency of an entity's hierarchy modifiers.
   */
  public validateEntity(entity: IREntity): void {
    const errorToken: Token = {
      line: entity.line || 1,
      column: entity.column || 1,
      type: TokenType.UNKNOWN,
      value: entity.name,
    }

    // RULE: An entity cannot be both abstract and leaf/final
    if (entity.isAbstract && (entity.isLeaf || entity.isFinal)) {
      const modifier = entity.isLeaf ? 'leaf' : 'final'
      this.context.addError(
        `Invalid declaration: Entity '${entity.name}' cannot be both 'abstract' and '${modifier}'. Abstract entities must be extensible.`,
        errorToken,
        DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
      )
    }
  }

  /**
   * Validates that there are no inheritance cycles.
   */
  public validateNoCycles(relationships: IRRelationship[]): void {
    const inheritanceGraph = new Map<string, string[]>()

    // 1. Build graph with inheritance only
    relationships.forEach((rel) => {
      if (rel.type === IRRelationshipType.GENERALIZATION) {
        if (!inheritanceGraph.has(rel.from)) {
          inheritanceGraph.set(rel.from, [])
        }
        inheritanceGraph.get(rel.from)!.push(rel.to)
      }
    })

    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const detectCycle = (node: string, path: string[]): boolean => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const children = inheritanceGraph.get(node) ?? []
      for (const child of children) {
        if (!visited.has(child)) {
          if (detectCycle(child, path)) return true
        } else if (recursionStack.has(child)) {
          path.push(child)
          const cycleStr = path.map((id) => this.symbolTable.get(id)?.name || id).join(' -> ')

          this.context.addError(
            `Inheritance cycle detected: ${cycleStr}`,
            undefined,
            DiagnosticCode.SEMANTIC_CYCLE_DETECTED,
          )
          return true
        }
      }

      recursionStack.delete(node)
      path.pop()
      return false
    }

    for (const node of inheritanceGraph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node, [])
      }
    }
  }

  /**
   * Validates a single inheritance/implementation relationship.
   */
  public validateRelationship(from: IREntity, to: IREntity, type: IRRelationshipType): void {
    const errorToken: Token = {
      line: from.line || 1,
      column: from.column || 1,
      type: TokenType.UNKNOWN,
      value: from.name, // Use the entity name for length
    }

    // 1. RULE: Inheritance (>>) rules
    if (type === IRRelationshipType.GENERALIZATION) {
      // General match check
      if (from.type !== to.type) {
        // Leniency for DataType: In TS mode, many entities start as DataType
        // and are refined later based on their relationships.
        // Also, UML allows generalization between Classifiers.
        const isFromClassLike =
          from.type === IREntityType.CLASS || from.type === IREntityType.DATA_TYPE
        const isToClassLike = to.type === IREntityType.CLASS || to.type === IREntityType.DATA_TYPE
        const isFromInterfaceLike =
          from.type === IREntityType.INTERFACE || from.type === IREntityType.DATA_TYPE
        const isToInterfaceLike =
          to.type === IREntityType.INTERFACE || to.type === IREntityType.DATA_TYPE

        const isValidInheritance =
          (isFromClassLike && isToClassLike) || (isFromInterfaceLike && isToInterfaceLike)

        if (!isValidInheritance) {
          this.context.addError(
            `Invalid inheritance: ${from.type} '${from.name}' cannot extend ${to.type} '${to.name}'. Both must be of the same type.`,
            errorToken,
            DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
          )
          return
        }
      }

      // RULE: Cannot extend a leaf/final entity
      if (to.isLeaf || to.isFinal) {
        const modifier = to.isLeaf ? '{leaf}' : '<<final>>'
        this.context.addError(
          `Invalid inheritance: Entity '${from.name}' cannot extend '${to.name}' because it is marked as ${modifier}.`,
          errorToken,
          DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
        )
        return
      }

      // RULE: An entity cannot be both abstract and leaf/final
      if (from.isAbstract && (from.isLeaf || from.isFinal)) {
        const modifier = from.isLeaf ? 'leaf' : 'final'
        this.context.addError(
          `Invalid declaration: Entity '${from.name}' cannot be both 'abstract' and '${modifier}'. Abstract entities must be extensible.`,
          errorToken,
          DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
        )
      }

      // RULE: An entity marked as 'root' cannot extend another entity
      if (from.isRoot) {
        this.context.addError(
          `Invalid inheritance: Entity '${from.name}' is marked as {root} and cannot extend '${to.name}'.`,
          errorToken,
          DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
        )
      }

      // Special case: Enums cannot extend/be extended
      if (from.type === IREntityType.ENUMERATION) {
        this.context.addError(
          `Invalid inheritance: Enums cannot participate in inheritance hierarchies ('${from.name}').`,
          errorToken,
          DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
        )
      }
    }

    // 2. RULE: Implementation (>I) rules
    if (type === IRRelationshipType.INTERFACE_REALIZATION) {
      // Target must be an Interface
      // In TS mode, interfaces with only properties are promoted to DataType.
      // We allow implementing them as well.
      if (to.type !== IREntityType.INTERFACE && to.type !== IREntityType.DATA_TYPE) {
        const reco =
          to.type === IREntityType.CLASS
            ? 'Use inheritance (>>).'
            : 'This relationship is not allowed in UML.'
        this.context.addError(
          `Invalid implementation: '${from.name}' cannot implement ${to.type} '${to.name}'. Only interfaces can be implemented. ${reco}`,
          errorToken,
          DiagnosticCode.SEMANTIC_INTERFACE_REALIZATION_INVALID,
        )
        return
      }

      // Source must be a Class (or a DataType that will be refined to a Class)
      if (from.type !== IREntityType.CLASS && from.type !== IREntityType.DATA_TYPE) {
        this.context.addError(
          `Invalid implementation: An ${from.type} ('${from.name}') cannot implement an interface. Only classes can satisfy interface contracts.`,
          errorToken,
          DiagnosticCode.SEMANTIC_INTERFACE_REALIZATION_INVALID,
        )
      }
    }
  }
}
