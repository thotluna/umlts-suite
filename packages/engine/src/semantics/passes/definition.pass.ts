import { type ASTVisitor, walkAST } from '../../syntax/visitor'
import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode,
  ConfigNode,
  AssociationClassNode,
  ConstraintNode,
} from '../../syntax/nodes'
import type { IRConstraint } from '../../generator/ir/models'
import type { AnalysisSession } from '../session/analysis-session'
import type { EntityAnalyzer } from '../analyzers/entity-analyzer'

/**
 * Pass 2: Definition.
 * Processes members and their types now that all entities are known.
 * Extracted from SemanticAnalyzer.
 */
export class DefinitionPass implements ASTVisitor {
  private currentNamespace: string[] = []

  constructor(
    private readonly session: AnalysisSession,
    private readonly entityAnalyzer: EntityAnalyzer,
  ) {}

  public run(program: ProgramNode): void {
    this.currentNamespace = []
    walkAST(program, this)
  }

  visitProgram(node: ProgramNode): void {
    ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name)
    ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const fqn = this.session.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.session.symbolTable.get(fqn)

    if (entity) {
      this.entityAnalyzer.processMembers(entity, node)

      // Scan both properties and operations for constraints
      const allMembers: { constraints?: IRConstraint[] }[] = [
        ...(entity.properties || []),
        ...(entity.operations || []),
      ]

      allMembers.forEach((member) => {
        member.constraints?.forEach((c) => {
          if (c.kind === 'xor') {
            this.session.constraintRegistry.add(c)
          }
        })
      })
    }
  }

  visitRelationship(node: RelationshipNode): void {
    if (node.body && node.body.length > 0) {
      const ns = this.currentNamespace.join('.')
      const fromFQN = this.session.symbolTable.resolveFQN(node.from, ns).fqn
      const fromEntity = this.session.symbolTable.get(fromFQN)
      if (fromEntity) {
        this.entityAnalyzer.appendMembers(fromEntity, node.body)
      }
    }
  }

  visitComment(_node: CommentNode): void {
    // Comments have no semantic impact in this pass
  }

  visitConfig(_node: ConfigNode): void {
    // Config processed in DiscoveryPass
  }

  visitAssociationClass(node: AssociationClassNode): void {
    const fqn = this.session.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.session.symbolTable.get(fqn)
    if (entity && node.body) {
      this.entityAnalyzer.processAssociationClassMembers(entity, node)
    }
  }

  visitConstraint(_node: ConstraintNode): void {
    // Top level constraints processed in ResolutionPass or via Registry
  }
}
