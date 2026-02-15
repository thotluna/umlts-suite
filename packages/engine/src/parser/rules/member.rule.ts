import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, type MemberNode } from '../ast/nodes'
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

    const modifiers = {
      isStatic: false,
      isAbstract: false,
      isLeaf: false,
      isFinal: false,
    }

    let found = true
    while (found) {
      found = false
      if (context.match(TokenType.KW_STATIC, TokenType.MOD_STATIC)) {
        modifiers.isStatic = true
        found = true
      }
      if (context.match(TokenType.KW_ABSTRACT, TokenType.MOD_ABSTRACT)) {
        modifiers.isAbstract = true
        found = true
      }
      if (context.match(TokenType.KW_LEAF, TokenType.MOD_LEAF)) {
        modifiers.isLeaf = true
        found = true
      }
      if (context.match(TokenType.KW_FINAL)) {
        modifiers.isFinal = true
        found = true
      }
    }

    const { isStatic, isAbstract, isLeaf, isFinal } = modifiers

    const nameToken = context.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre del miembro')

    if (context.check(TokenType.LPAREN)) {
      return this.methodRule.parse(
        context,
        nameToken,
        visibility,
        isStatic,
        isAbstract,
        isLeaf,
        isFinal,
      )
    } else {
      return this.attributeRule.parse(context, nameToken, visibility, isStatic, isLeaf, isFinal)
    }
  }
}
