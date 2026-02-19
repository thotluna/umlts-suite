import { type ASTVisitor, walkAST } from '../../syntax/visitor'
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
} from '../../syntax/nodes'
import type { AnalysisSession } from '../session/analysis-session'
import type { RelationshipAnalyzer } from '../analyzers/relationship-analyzer'
import type { ConstraintAnalyzer } from '../analyzers/constraint-analyzer'
import { AssociationClassResolver } from '../resolvers/association-class.resolver'
import { TypeValidator } from '../utils/type-validator'

/**
 * Pass 3: Resolution.
 * Resolves relationships and generates implicit entities if required.
 * Extracted from SemanticAnalyzer.
 */
export class ResolutionPass implements ASTVisitor {
  private currentNamespace: string[] = []
  private currentConstraintGroupId?: string

  constructor(
    private readonly session: AnalysisSession,
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly constraintAnalyzer: ConstraintAnalyzer,
    // We keep the dependency injection but might not use this instance directly
    // if we need to recreate it with new context.
    private readonly associationResolver: AssociationClassResolver,
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
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.session.symbolTable.resolveFQN(node.name, ns).fqn
    const fromEntity = this.session.symbolTable.get(fromFQN)

    ;(node.relationships || []).forEach((rel) => {
      // Calculate inference context
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

    // Resolve 'from' entity first
    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.from,
      ns,
      node.fromModifiers,
      node.line,
      node.column,
    )
    const fromEntity = this.session.symbolTable.get(fromFQN)

    // Inference for 'to' entity based on 'from' entity type
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
    // We instantiate a new resolver for this specific context (namespace)
    // Dependencies are passed from the session/analyzer context
    const resolver = new AssociationClassResolver(this.session, this.relationshipAnalyzer, [
      ...this.currentNamespace,
    ])
    resolver.resolve(node)
  }

  visitConstraint(node: ConstraintNode): void {
    const irConstraint = this.constraintAnalyzer.process(node)

    // If it's xor and has targets (like {xor: group1}), we store it
    if (irConstraint.targets.length > 0) {
      this.session.constraintRegistry.add(irConstraint)
    } else if (node.kind === 'xor' && node.body) {
      // It's a block XOR. We generate a unique group ID for its children.
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
