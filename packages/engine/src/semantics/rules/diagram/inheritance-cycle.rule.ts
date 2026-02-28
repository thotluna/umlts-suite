import type { IRDiagram } from '@engine/generator/ir/models'
import { IRRelationshipType } from '@engine/generator/ir/models'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import {
  SemanticTargetType,
  type ISemanticRule,
} from '@engine/semantics/core/semantic-rule.interface'
import type { SymbolTable } from '@engine/semantics/symbol-table'

/**
 * Validates that there are no inheritance cycles in the diagram.
 */
export class InheritanceCycleRule implements ISemanticRule<SemanticTargetType.DIAGRAM> {
  public readonly id = 'rule:diagram:inheritance-cycle'
  public readonly target = SemanticTargetType.DIAGRAM

  constructor(private readonly symbolTable: SymbolTable) {}

  public validate(diagram: IRDiagram, context: ISemanticContext): void {
    const inheritanceGraph = new Map<string, string[]>()

    // 1. Build graph with inheritance only
    diagram.relationships.forEach((rel) => {
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

          context.addError(
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

    // 2. Check each node for cycles
    for (const node of inheritanceGraph.keys()) {
      if (!visited.has(node)) {
        detectCycle(node, [])
      }
    }
  }
}
