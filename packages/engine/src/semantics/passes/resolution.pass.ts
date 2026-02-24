import { type ASTVisitor, walkAST } from '@engine/syntax/visitor'
import {
  type ProgramNode,
  type PackageNode,
  type EntityNode,
  type RelationshipNode,
  type CommentNode,
  type ConfigNode,
  type AssociationClassNode,
  type ConstraintNode,
} from '@engine/syntax/nodes'
import type { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import type { ConstraintAnalyzer } from '@engine/semantics/analyzers/constraint-analyzer'
import { AssociationClassResolver } from '@engine/semantics/resolvers/association-class.resolver'
import type { ISemanticPass } from '@engine/semantics/passes/semantic-pass.interface'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'

/**
 * Pase 3: Resolución.
 * Resuelve relaciones y genera entidades implícitas si es necesario.
 */
export class ResolutionPass implements ISemanticPass, ASTVisitor {
  public readonly name = 'Resolution'
  private currentNamespace: string[] = []
  private currentConstraintGroupId?: string
  private state!: ISemanticState

  constructor(
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly constraintAnalyzer: ConstraintAnalyzer,
    private readonly associationResolver: AssociationClassResolver,
  ) {}

  public execute(program: ProgramNode, state: ISemanticState): void {
    this.state = state
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
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.state.symbolTable.resolveFQN(node.name, ns).fqn
    const fromEntity = this.state.symbolTable.get(fromFQN)

    ;(node.relationships || []).forEach((rel) => {
      const relType = this.relationshipAnalyzer.mapRelationshipType(rel.kind)
      const inferenceContext = fromEntity
        ? { sourceType: fromEntity.type, relationshipKind: relType }
        : undefined

      const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        rel.target,
        ns,
        rel.targetModifiers,
        rel.line,
        rel.column,
        inferenceContext,
        fromEntity?.typeParameters,
      )
      this.relationshipAnalyzer.addRelationship(
        fromFQN,
        toFQN,
        rel.kind,
        rel,
        this.currentConstraintGroupId,
      )
    })
  }

  visitRelationship(node: RelationshipNode): void {
    const ns = this.currentNamespace.join('.')
    const relType = this.relationshipAnalyzer.mapRelationshipType(node.kind)

    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.from,
      ns,
      node.fromModifiers,
      node.line,
      node.column,
    )
    const fromEntity = this.state.symbolTable.get(fromFQN)

    const inferenceContext = fromEntity
      ? { sourceType: fromEntity.type, relationshipKind: relType }
      : undefined

    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.to,
      ns,
      node.toModifiers,
      node.line,
      node.column,
      inferenceContext,
      fromEntity?.typeParameters,
    )
    this.relationshipAnalyzer.addRelationship(
      fromFQN,
      toFQN,
      node.kind,
      node,
      this.currentConstraintGroupId,
    )
  }

  visitComment(_node: CommentNode): void {}
  visitConfig(_node: ConfigNode): void {}

  visitAssociationClass(node: AssociationClassNode): void {
    const resolver = new AssociationClassResolver(this.state, this.relationshipAnalyzer, [
      ...this.currentNamespace,
    ])
    resolver.resolve(node)
  }

  visitConstraint(node: ConstraintNode): void {
    const irConstraint = this.constraintAnalyzer.process(node)

    if (irConstraint.targets.length > 0) {
      this.state.constraintRegistry.add(irConstraint)
    } else if (node.kind === 'xor' && node.body) {
      const groupId = `xor_${node.line}_${node.column}`
      irConstraint.targets = [groupId]
      this.state.constraintRegistry.add(irConstraint)

      const oldGroupId = this.currentConstraintGroupId
      this.currentConstraintGroupId = groupId
      ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
      this.currentConstraintGroupId = oldGroupId
    }
  }
}
