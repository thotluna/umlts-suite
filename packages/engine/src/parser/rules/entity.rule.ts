import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { MemberNode, StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { RelationshipHeaderRule } from './relationship-header.rule'
import { MemberRule } from './member.rule'
import { ModifierRule } from './modifier.rule'

import { ASTFactory } from '../factory/ast.factory'

/**
 * EntityRule: Regla para parsear Clases e Interfaces.
 */
export class EntityRule implements StatementRule {
  private readonly relationshipHeaderRule = new RelationshipHeaderRule()
  private readonly memberRule = new MemberRule()

  public canHandle(context: IParserHub): boolean {
    const skip = ModifierRule.countModifiers(context)
    const target = context.lookahead(skip).type
    return target === TokenType.KW_CLASS || target === TokenType.KW_INTERFACE
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    let modifiers = ModifierRule.parse(context)

    if (!context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE)) {
      context.rollback(pos)
      return []
    }
    const keywordToken = context.prev()

    modifiers = ModifierRule.parse(context, modifiers)

    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Entity name expected')
    const type =
      keywordToken.type === TokenType.KW_CLASS
        ? (ASTNodeType.CLASS as const)
        : (ASTNodeType.INTERFACE as const)

    const docs = context.consumePendingDocs()

    // Soporte para genéricos: <T, K>
    let typeParameters: string[] | undefined
    if (context.match(TokenType.LT)) {
      typeParameters = []
      do {
        const paramToken = context.softConsume(TokenType.IDENTIFIER, 'Type parameter name expected')
        typeParameters.push(paramToken.value)
      } while (context.match(TokenType.COMMA))
      context.softConsume(TokenType.GT, "Expected '>' after type parameters")
    }

    // Parse relationship list in header
    const relationships = this.relationshipHeaderRule.parse(context)

    // Parse body members
    let body: MemberNode[] | undefined
    if (context.match(TokenType.LBRACE)) {
      body = []
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        try {
          const member = this.memberRule.parse(context, orchestrator)
          if (member != null) {
            body.push(member)
          } else {
            context.addError('Unrecognized member in entity body', context.peek())
            context.advance()
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Error parsing member'
          context.addError(msg)
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}'")
    }

    return [
      ASTFactory.createEntity(
        type,
        nameToken.value,
        modifiers,
        relationships,
        body,
        keywordToken.line,
        keywordToken.column,
        docs,
        typeParameters,
      ),
    ]
  }
}
