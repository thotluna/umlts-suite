import type { IREntity, IRRelationship } from '../../generator/ir/models'
import { IRRelationshipType, IREntityType } from '../../generator/ir/models'
import { DiagnosticCode } from '../../parser/diagnostic.types'
import type { SymbolTable } from '../symbol-table'
import { TokenType } from '../../lexer/token.types'
import type { Token } from '../../lexer/token.types'
import type { ParserContext } from '../../parser/parser.context'

/**
 * Validator for hierarchy-related rules (cycles, inheritance consistency).
 */
export class HierarchyValidator {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly context: ParserContext,
  ) {}

  /**
   * Validates that there are no inheritance cycles.
   */
  public validateNoCycles(relationships: IRRelationship[]): void {
    const inheritanceGraph = new Map<string, string[]>()

    // 1. Build graph with inheritance only
    relationships.forEach((rel) => {
      if (rel.type === IRRelationshipType.INHERITANCE) {
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
    if (type === IRRelationshipType.INHERITANCE) {
      // General match check
      if (from.type !== to.type) {
        this.context.addError(
          `Invalid inheritance: ${from.type} '${from.name}' cannot extend ${to.type} '${to.name}'. Both must be of the same type.`,
          errorToken,
          DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
        )
        return
      }

      // Special case: Enums cannot extend/be extended
      if (from.type === IREntityType.ENUM) {
        this.context.addError(
          `Invalid inheritance: Enums cannot participate in inheritance hierarchies ('${from.name}').`,
          errorToken,
          DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
        )
      }
    }

    // 2. RULE: Implementation (>I) rules
    if (type === IRRelationshipType.IMPLEMENTATION) {
      // Target must be an Interface
      if (to.type !== IREntityType.INTERFACE) {
        const reco =
          to.type === IREntityType.CLASS
            ? 'Use inheritance (>>).'
            : 'This relationship is not allowed in UML.'
        this.context.addError(
          `Invalid implementation: '${from.name}' cannot implement ${to.type} '${to.name}'. Only interfaces can be implemented. ${reco}`,
          errorToken,
          DiagnosticCode.SEMANTIC_REALIZATION_INVALID,
        )
        return
      }

      // Source must be a Class (or theoretically a Component, which we map as Class for now)
      if (from.type !== IREntityType.CLASS) {
        this.context.addError(
          `Invalid implementation: An ${from.type} ('${from.name}') cannot implement an interface. Only classes can satisfy interface contracts.`,
          errorToken,
          DiagnosticCode.SEMANTIC_REALIZATION_INVALID,
        )
      }
    }
  }
}
