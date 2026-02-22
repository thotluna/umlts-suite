import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { AssociationClassNode, MemberNode, StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { ModifierRule } from './modifier.rule'
import { RelationshipHeaderRule } from './relationship-header.rule'
import { MemberRule } from './member.rule'

/**
 * AssociationClassRule: Regla para parsear Clases de Asociación.
 * Sintaxis: class C <> (A[m], B[n]) { ... }
 */
export class AssociationClassRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public canStart(context: IParserHub): boolean {
    // Empieza como una clase normal
    return context.checkAny(
      TokenType.KW_CLASS,
      TokenType.MOD_ABSTRACT,
      TokenType.KW_ABSTRACT,
      TokenType.MOD_STATIC,
      TokenType.KW_STATIC,
    )
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    ModifierRule.parse(context)

    if (!context.match(TokenType.KW_CLASS)) {
      context.rollback(pos)
      return []
    }
    const keywordToken = context.prev()

    // Consumimos posibles modificadores (aunque el nodo no los use por ahora)
    ModifierRule.parse(context)

    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Class name expected')

    // Aquí es donde decidimos si es una Clase de Asociación
    if (!context.match(TokenType.OP_ASSOC_BIDIR)) {
      context.rollback(pos)
      return []
    }

    context.softConsume(TokenType.LPAREN, "Expected '(' after '<>' in association class")
    const participants: AssociationClassNode['participants'] = []

    do {
      const pNameToken = context.softConsume(TokenType.IDENTIFIER, 'Expected participant name')

      let multiplicity: string | undefined
      if (context.match(TokenType.LBRACKET)) {
        multiplicity = ''
        while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
          multiplicity += context.advance().value
        }
        context.softConsume(TokenType.RBRACKET, "Expected ']'")
      }

      const relationships = this.relationshipHeaderRule.parse(context)

      participants.push({
        name: pNameToken.value,
        multiplicity,
        relationships,
      })
    } while (context.match(TokenType.COMMA))

    context.softConsume(TokenType.RPAREN, "Expected ')' after participants")

    let body: MemberNode[] | undefined
    if (context.match(TokenType.LBRACE)) {
      body = []
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const member = this.memberRule.parse(context)
        if (member) {
          body.push(member)
        } else {
          context.addError('Unrecognized member in association class', context.peek())
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}'")
    }

    return [
      {
        type: ASTNodeType.ASSOCIATION_CLASS,
        name: nameToken.value,
        participants,
        body,
        line: keywordToken.line,
        column: keywordToken.column,
        docs: context.consumePendingDocs(),
      } as AssociationClassNode,
    ]
  }
}
