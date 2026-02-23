import { TokenType } from '@engine/syntax/token.types'
import {
  type AssociationClassNode,
  type MemberNode,
  type StatementNode,
} from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ModifierRule } from '@engine/parser/rules/modifier.rule'
import { RelationshipHeaderRule } from '@engine/parser/rules/relationship-header.rule'
import { MemberRule } from '@engine/parser/rules/member.rule'

import { ASTFactory } from '@engine/parser/factory/ast.factory'

/**
 * AssociationClassRule: Regla para parsear Clases de Asociación.
 * Sintaxis: class C <> (A[m], B[n]) { ... }
 */
export class AssociationClassRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public canHandle(context: IParserHub): boolean {
    let i = ModifierRule.countModifiers(context)

    // 2. Debe tener 'class'
    if (context.lookahead(i).type !== TokenType.KW_CLASS) return false
    i++

    // 3. Omitir nombre (puede ser FQN)
    if (context.lookahead(i).type !== TokenType.IDENTIFIER) return false
    i++
    while (context.lookahead(i).type === TokenType.DOT) {
      i++
      if (context.lookahead(i).type !== TokenType.IDENTIFIER) return false
      i++
    }

    // 4. Omitir modificadores secundarios (ej: class abstract Name)
    i += ModifierRule.countModifiers(context, i)

    // 5. Debe tener el operador de asociación <>
    return context.lookahead(i).type === TokenType.OP_ASSOC_BIDIR
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
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

    const docs = context.consumePendingDocs()

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
        const member = this.memberRule.parse(context, orchestrator)
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
      ASTFactory.createAssociationClass(
        nameToken.value,
        participants,
        keywordToken.line,
        keywordToken.column,
        body,
        docs,
      ),
    ]
  }
}
