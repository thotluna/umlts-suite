import { ASTNodeType, type ASTNode } from '../../syntax/nodes'
import type { AttributeNode, MethodNode, RelationshipNode, RelationshipHeaderNode } from '../../syntax/nodes'
import type { SymbolTable } from '../symbol-table'
import { IRRelationshipType, type IRRelationship } from '../../generator/ir/models'
import { AssociationValidator } from '../validators/association-validator'
import type { IParserHub } from '../../parser/parser.context'

/**
 * Analyzes and registers relationships between entities.
 */
export class RelationshipAnalyzer {
  private readonly relationships: IRRelationship[] = []

  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly associationValidator: AssociationValidator,
    private readonly context: IParserHub,
  ) {}

  /**
   * Registers a relationship.
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
    let labelFromNode: string | undefined

    if (node != null) {
      if (node.type === ASTNodeType.RELATIONSHIP) {
        if ('to' in node) {
          targetName = (node as RelationshipNode).to
          originalTarget = (node as RelationshipNode).to
        } else if ('target' in node) {
          targetName = (node as RelationshipHeaderNode).target
          originalTarget = (node as RelationshipHeaderNode).target
        }
      } else if (node.type === ASTNodeType.ATTRIBUTE) {
        labelFromNode = (node as AttributeNode).name
      } else if (node.type === ASTNodeType.METHOD) {
        labelFromNode = (node as MethodNode).name
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

    if (!isValidTarget && originalTarget) {
      // If validation failed but we have a target name, try a global scout
      const globalScout = Array.from(this.symbolTable.getAll().keys()).find(
        (id) => id.endsWith(`.${originalTarget}`) || id === originalTarget,
      )
      if (globalScout) {
        toFQN = globalScout
      }
    }

    const rel: IRRelationship = {
      from: fromFQN,
      to: toFQN,
      type: relType,
      line: node?.line,
      column: node?.column,
      docs: node?.docs,
      label: labelFromNode || (node as any)?.label,
      isNavigable: (node as any)?.isNavigable ?? true,
      constraints: (node as any)?.constraints,
    }

    if (node?.type === ASTNodeType.RELATIONSHIP) {
      const rNode = node as RelationshipNode
      rel.fromMultiplicity = this.parseMultiplicity(rNode.fromMultiplicity)
      rel.toMultiplicity = this.parseMultiplicity(rNode.toMultiplicity)
    } else if (node?.type === ASTNodeType.ATTRIBUTE) {
      const aNode = node as AttributeNode
      rel.toMultiplicity = this.parseMultiplicity(aNode.multiplicity)
    }

    this.relationships.push(rel)
  }

  /**
   * Returns all registered relationships.
   */
  public getRelationships(): IRRelationship[] {
    return this.relationships
  }

  private parseMultiplicity(m?: string) {
    if (!m) return undefined
    const parts = m.split('..')
    return {
      lower: parseInt(parts[0]) || 0,
      upper: (parts[1] === '*' ? '*' : parseInt(parts[1])) || (parts[0] === '*' ? '*' : parseInt(parts[0])) || 1,
    } as any
  }

  private mapRelationshipType(kind: string): IRRelationshipType {
    const k = kind.toLowerCase().trim()
    switch (k) {
      case '>>':
      case 'extends':
      case 'extend':
        return IRRelationshipType.INHERITANCE
      case '>i':
      case 'implements':
      case 'implement':
        return IRRelationshipType.IMPLEMENTATION
      case '>>*':
      case 'composite':
        return IRRelationshipType.COMPOSITION
      case '>>o':
      case 'shared':
      case 'aggregation':
        return IRRelationshipType.AGGREGATION
      case '>-':
      case 'dependency':
        return IRRelationshipType.DEPENDENCY
      case '>u':
      case 'usage':
        return IRRelationshipType.USAGE
      default:
        return IRRelationshipType.ASSOCIATION
    }
  }
}
