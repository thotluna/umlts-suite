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
            `Ciclo de herencia detectado: ${cycleStr}`,
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
    if (type === IRRelationshipType.INHERITANCE) {
      if (from.type !== to.type) {
        this.context.addError(
          `Herencia inválida: ${from.type} '${from.name}' no puede extender ${to.type} '${to.name}'.`,
          {
            line: from.line || 1,
            column: from.column || 1,
            type: TokenType.UNKNOWN,
            value: '',
          } as Token,
          DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
        )
      }
    }

    if (type === IRRelationshipType.IMPLEMENTATION) {
      if (from.type === IREntityType.CLASS && to.type === IREntityType.CLASS) {
        this.context.addError(
          `Realización inválida: Una clase no puede implementar otra clase '${to.name}'. Usar herencia.`,
          {
            line: from.line || 1,
            column: from.column || 1,
            type: TokenType.UNKNOWN,
            value: '',
          } as Token,
          DiagnosticCode.SEMANTIC_REALIZATION_INVALID,
        )
      }
    }
  }
}
