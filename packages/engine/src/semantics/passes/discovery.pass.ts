import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  CommentNode,
  ConfigNode,
  RelationshipNode,
  AssociationClassNode,
  ConstraintNode,
  NoteNode,
  AnchorNode,
  AttributeNode,
  MethodNode,
  ParameterNode,
} from '@engine/syntax/nodes'
import { type ASTVisitor, walkAST } from '@engine/syntax/visitor'
import type { EntityAnalyzer } from '@engine/semantics/analyzers/entity-analyzer'
import type { HierarchyValidator } from '@engine/semantics/validators/hierarchy-validator'
import type { ISemanticPass } from '@engine/semantics/passes/semantic-pass.interface'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'
import { FQNBuilder } from '@engine/semantics/utils/fqn-builder'
import { TokenType, type Token } from '@engine/syntax/token.types'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { TypeValidator } from '@engine/semantics/utils/type-validator'

/**
 * Pase 1: Descubrimiento.
 * Identifica todas las entidades y construye la tabla de símbolos inicial.
 */
export class DiscoveryPass implements ISemanticPass, ASTVisitor {
  public readonly name = 'Discovery'
  private currentNamespace: string[] = []
  private state!: ISemanticState

  constructor(
    private readonly entityAnalyzer: EntityAnalyzer,
    private readonly hierarchyValidator: HierarchyValidator,
  ) {}

  public execute(program: ProgramNode, state: ISemanticState): void {
    this.state = state
    this.currentNamespace = []

    // Register primitives from language plugins + UML Standard
    const pluginPrimitives = state.context.registry?.language?.getPrimitiveTypes() || []
    const allPrimitives = [...new Set([...pluginPrimitives, ...TypeValidator.PRIMITIVES])]
    allPrimitives.forEach((p) => state.symbolTable.registerPrimitive(p))

    walkAST(program, this)
  }

  visitProgram(node: ProgramNode): void {
    ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
  }

  visitPackage(node: PackageNode): void {
    const fqn = FQNBuilder.build(node.name, this.currentNamespace.join('.'))
    this.state.symbolTable.registerNamespace(fqn)

    this.currentNamespace.push(node.name)
    ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const ns = this.currentNamespace.join('.')
    const fqn = FQNBuilder.build(node.name, ns)

    if (this.state.symbolTable.has(fqn)) {
      const existing = this.state.symbolTable.get(fqn)
      if (existing && !existing.isImplicit) {
        this.state.context.addError(
          `Entity '${node.name}' is already defined in namespace '${ns || 'global'}'.`,
          {
            line: node.line,
            column: node.column,
            type: TokenType.IDENTIFIER,
            value: node.name,
          } as Token,
          DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
        )
        return
      }
    }

    const entity = this.entityAnalyzer.buildEntity(node, ns)
    this.state.symbolTable.register(entity)
    this.hierarchyValidator.validateEntity(entity)
  }

  visitRelationship(_node: RelationshipNode): void {}
  visitComment(_node: CommentNode): void {}
  visitConfig(node: ConfigNode): void {
    this.state.configStore.merge(node.options)
  }

  visitAssociationClass(node: AssociationClassNode): void {
    const ns = this.currentNamespace.join('.')
    const fqn = FQNBuilder.build(node.name, ns)

    if (this.state.symbolTable.has(fqn)) {
      const existing = this.state.symbolTable.get(fqn)
      if (existing && !existing.isImplicit) {
        this.state.context.addError(
          `Entity (Association Class) '${node.name}' is already defined in namespace '${ns || 'global'}'.`,
          {
            line: node.line,
            column: node.column,
            type: TokenType.IDENTIFIER,
            value: node.name,
          } as Token,
          DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
        )
        return
      }
    }

    const entity = this.entityAnalyzer.buildAssociationClass(node, ns)
    this.state.symbolTable.register(entity)
  }

  visitConstraint(_node: ConstraintNode): void {}
  visitNote(_node: NoteNode): void {}
  visitAnchor(_node: AnchorNode): void {}
  visitAttribute(_node: AttributeNode): void {}
  visitMethod(_node: MethodNode): void {}
  visitParameter(_node: ParameterNode): void {}
}
