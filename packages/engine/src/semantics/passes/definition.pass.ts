import { type ASTVisitor, walkAST } from '@engine/syntax/visitor'
import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode,
  ConfigNode,
  AssociationClassNode,
  ConstraintNode,
} from '@engine/syntax/nodes'
import type { IRConstraint } from '@engine/generator/ir/models'
import type { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { EntityAnalyzer } from '@engine/semantics/analyzers/entity-analyzer'
import type { ISemanticPass } from '@engine/semantics/passes/semantic-pass.interface'

/**
 * Pase 2: Definición.
 * Procesa los miembros y sus tipos una vez que todas las entidades son conocidas.
 */
export class DefinitionPass implements ISemanticPass, ASTVisitor {
  public readonly name = 'Definition'
  private currentNamespace: string[] = []
  private session!: AnalysisSession

  constructor(private readonly entityAnalyzer: EntityAnalyzer) {}

  public execute(program: ProgramNode, session: AnalysisSession): void {
    this.session = session
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

  visitComment(_node: CommentNode): void {}
  visitConfig(_node: ConfigNode): void {}

  visitAssociationClass(node: AssociationClassNode): void {
    const fqn = this.session.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.session.symbolTable.get(fqn)
    if (entity && node.body) {
      this.entityAnalyzer.processAssociationClassMembers(entity, node)
    }
  }

  visitConstraint(_node: ConstraintNode): void {}
}
