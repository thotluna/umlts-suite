import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type MemberNode } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'
import { AttributeRule } from './attribute.rule'
import { MethodRule } from './method.rule'

export class MemberRule {
  private readonly attributeRule = new AttributeRule()
  private readonly methodRule = new MethodRule()

  public parse(context: ParserContext): MemberNode | null {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value)
      return this.parse(context)
    }

    if (context.check(TokenType.COMMENT)) {
      const token = context.consume(TokenType.COMMENT, '')
      return {
        type: ASTNodeType.COMMENT,
        value: token.value,
        line: token.line,
        column: token.column,
      }
    }

    // Visibilidad opcional
    let visibility = 'public'
    if (
      context.match(TokenType.VIS_PUB, TokenType.VIS_PRIV, TokenType.VIS_PROT, TokenType.VIS_PACK)
    ) {
      visibility = context.prev().value
    } else if (
      context.match(
        TokenType.KW_PUBLIC,
        TokenType.KW_PRIVATE,
        TokenType.KW_PROTECTED,
        TokenType.KW_INTERNAL,
      )
    ) {
      visibility = context.prev().value
    }

    const modifiers = context.consumeModifiers()

    const nameToken = context.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre del miembro')

    if (context.check(TokenType.LPAREN)) {
      return this.methodRule.parse(context, nameToken, visibility, modifiers)
    } else {
      return this.attributeRule.parse(context, nameToken, visibility, modifiers)
    }
  }
}
