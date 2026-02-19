import { IRRelationshipType } from '../../generator/ir/models'
import { DiagnosticCode } from '../../syntax/diagnostic.types'
import { TokenType, type Token } from '../../syntax/token.types'
import type { AssociationClassNode } from '../../syntax/nodes'
import type { AnalysisSession } from '../session/analysis-session'
import type { RelationshipAnalyzer } from '../analyzers/relationship-analyzer'

/**
 * Handles the semantic resolution of Association Classes.
 * Extracted from ResolutionVisitor.
 */
export class AssociationClassResolver {
  constructor(
    private readonly session: AnalysisSession,
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly currentNamespace: string[],
  ) {}

  public resolve(node: AssociationClassNode): void {
    const ns = this.currentNamespace.join('.')
    const assocFQN = this.session.symbolTable.resolveFQN(node.name, ns).fqn

    ;(node.participants || []).forEach((p) => {
      let currentFromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        p.name,
        ns,
        {},
        node.line,
        node.column,
      )

      p.relationships?.forEach((rel) => {
        const relType = this.relationshipAnalyzer.mapRelationshipType(rel.kind)
        const fromEntity = this.session.symbolTable.get(currentFromFQN)
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
          currentFromFQN,
          toFQN,
          rel.kind,
          rel,
          undefined, // Constraint group ID not supported within assoc class chain
        )
        // Advance in the chain: the current target becomes the source for the next link
        currentFromFQN = toFQN
      })
    })

    if (node.participants.length !== 2) {
      if (this.session.context) {
        this.session.context.addError(
          `Association class '${node.name}' must have exactly 2 participants, found ${node.participants.length}.`,
          {
            line: node.line,
            column: node.column,
            type: TokenType.IDENTIFIER,
            value: node.name,
          } as Token,
          DiagnosticCode.SEMANTIC_INVALID_ASSOCIATION_CLASS,
        )
      }
      if (node.participants.length < 2) return
    }

    const p1 = node.participants[0]
    const p2 = node.participants[1]

    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      p1.name,
      ns,
      {},
      node.line,
      node.column,
    )
    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      p2.name,
      ns,
      {},
      node.line,
      node.column,
    )

    // Creamos la relación y la vinculamos a la clase
    this.relationshipAnalyzer.addResolvedRelationship(
      fromFQN,
      toFQN,
      IRRelationshipType.BIDIRECTIONAL,
      {
        line: node.line,
        column: node.column,
        fromMultiplicity: p1.multiplicity,
        toMultiplicity: p2.multiplicity,
        associationClassId: assocFQN,
      },
    )
  }
}
