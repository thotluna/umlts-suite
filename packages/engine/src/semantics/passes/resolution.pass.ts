import { type ASTVisitor, walkAST } from '@engine/syntax/visitor'
import {
  ASTNodeType,
  type ProgramNode,
  type PackageNode,
  type EntityNode,
  type RelationshipNode,
  type CommentNode,
  type ConfigNode,
  type AssociationClassNode,
  type ConstraintNode,
  type TypeNode,
} from '@engine/syntax/nodes'
import type { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import type { ConstraintAnalyzer } from '@engine/semantics/analyzers/constraint-analyzer'
import { AssociationClassResolver } from '@engine/semantics/resolvers/association-class.resolver'
import { TypeValidator } from '@engine/semantics/utils/type-validator'
import type { ISemanticPass } from '@engine/semantics/passes/semantic-pass.interface'

/**
 * Pase 3: Resolución.
 * Resuelve relaciones y genera entidades implícitas si es necesario.
 */
export class ResolutionPass implements ISemanticPass, ASTVisitor {
  public readonly name = 'Resolution'
  private currentNamespace: string[] = []
  private currentConstraintGroupId?: string
  private session!: AnalysisSession

  constructor(
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly constraintAnalyzer: ConstraintAnalyzer,
    private readonly associationResolver: AssociationClassResolver,
  ) {}

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
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.session.symbolTable.resolveFQN(node.name, ns).fqn
    const fromEntity = this.session.symbolTable.get(fromFQN)

    ;(node.relationships || []).forEach((rel) => {
      const relType = this.relationshipAnalyzer.mapRelationshipType(rel.kind)
      const inferenceContext = fromEntity
        ? { sourceType: fromEntity.type, relationshipKind: relType }
        : undefined

      const typeNodeLike = this.createTypeNode(rel.target, rel.line, rel.column)
      const plugin = this.session.pluginManager.getActive()
      const mapping = plugin?.resolveType(typeNodeLike)
      const targetName = mapping ? mapping.targetName : rel.target

      const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        targetName,
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
    const fromEntity = this.session.symbolTable.get(fromFQN)

    const inferenceContext = fromEntity
      ? { sourceType: fromEntity.type, relationshipKind: relType }
      : undefined

    const typeNodeLike = this.createTypeNode(node.to, node.line, node.column)
    const plugin = this.session.pluginManager.getActive()
    const mapping = plugin?.resolveType(typeNodeLike)
    const targetName = mapping ? mapping.targetName : node.to

    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      targetName,
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
    const resolver = new AssociationClassResolver(this.session, this.relationshipAnalyzer, [
      ...this.currentNamespace,
    ])
    resolver.resolve(node)
  }

  visitConstraint(node: ConstraintNode): void {
    const irConstraint = this.constraintAnalyzer.process(node)

    if (irConstraint.targets.length > 0) {
      this.session.constraintRegistry.add(irConstraint)
    } else if (node.kind === 'xor' && node.body) {
      const groupId = `xor_${node.line}_${node.column}`
      irConstraint.targets = [groupId]
      this.session.constraintRegistry.add(irConstraint)

      const oldGroupId = this.currentConstraintGroupId
      this.currentConstraintGroupId = groupId
      ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
      this.currentConstraintGroupId = oldGroupId
    }
  }

  private createTypeNode(typeName: string, line: number, column: number): TypeNode {
    const { baseName, args } = TypeValidator.decomposeGeneric(typeName)
    return {
      type: ASTNodeType.TYPE,
      name: baseName,
      raw: typeName,
      kind: args.length > 0 ? 'generic' : 'simple',
      arguments: args.map((arg) => this.createTypeNode(arg, line, column)),
      line,
      column,
    }
  }
}
