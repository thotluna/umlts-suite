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
  NoteNode,
  AnchorNode,
  AttributeNode,
  MethodNode,
  ParameterNode,
} from '@engine/syntax/nodes'
import type { EntityAnalyzer } from '@engine/semantics/analyzers/entity-analyzer'
import type { ISemanticPass } from '@engine/semantics/passes/semantic-pass.interface'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'

/**
 * Pase 2: Definición.
 * Procesa los miembros y sus tipos una vez que todas las entidades son conocidas.
 */
export class DefinitionPass implements ISemanticPass, ASTVisitor {
  public readonly name = 'Definition'
  private currentNamespace: string[] = []
  private state!: ISemanticState

  constructor(private readonly entityAnalyzer: EntityAnalyzer) {}

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
    const fqn = this.state.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.state.symbolTable.get(fqn)

    if (entity) {
      this.entityAnalyzer.processMembers(entity, node)
    }
  }

  visitRelationship(node: RelationshipNode): void {
    if (node.body && node.body.length > 0) {
      const ns = this.currentNamespace.join('.')
      const fromFQN = this.state.symbolTable.resolveFQN(node.from, ns).fqn
      const fromEntity = this.state.symbolTable.get(fromFQN)
      if (fromEntity) {
        this.entityAnalyzer.appendMembers(fromEntity, node.body)
      }
    }
  }

  visitComment(_node: CommentNode): void {}
  visitConfig(_node: ConfigNode): void {}

  visitAssociationClass(node: AssociationClassNode): void {
    const fqn = this.state.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.state.symbolTable.get(fqn)
    if (entity && node.body) {
      this.entityAnalyzer.processAssociationClassMembers(entity, node)
    }
  }

  visitConstraint(_node: ConstraintNode): void {}

  visitNote(node: NoteNode): void {
    this.state.recordNote({
      id: node.id || `note_${node.line}_${node.column}`,
      text: node.value,
      namespace: this.currentNamespace.join('.'),
      line: node.line,
      column: node.column,
    })
  }

  visitAnchor(node: AnchorNode): void {
    this.state.recordAnchor({
      from: node.from,
      to: node.to,
      line: node.line,
      column: node.column,
    })
  }

  visitAttribute(_node: AttributeNode): void {}
  visitMethod(_node: MethodNode): void {}
  visitParameter(_node: ParameterNode): void {}
}
