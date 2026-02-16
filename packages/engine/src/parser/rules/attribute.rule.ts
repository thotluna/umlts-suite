import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type AttributeNode, type Modifiers } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'
import { TypeRule } from './type.rule'

export class AttributeRule {
  private readonly typeRule = new TypeRule()

  public parse(
    context: ParserContext,
    name: Token,
    visibility: string,
    modifiers: Modifiers,
  ): AttributeNode {
    context.consume(TokenType.COLON, "Expected ':' after attribute name")

    // SOPORTE SECCIÓN 5.2 DE LA ESPECIFICACIÓN: Soporte de relaciones in-line
    let relationshipKind: string | undefined
    if (
      context.match(
        TokenType.OP_INHERIT,
        TokenType.OP_IMPLEMENT,
        TokenType.OP_COMP,
        TokenType.OP_AGREG,
        TokenType.OP_USE,
        TokenType.OP_ASSOC,
        TokenType.OP_ASSOC_BIDIR,
        TokenType.GT,
      )
    ) {
      relationshipKind = context.prev().value
    }

    const targetModifiers = context.consumeModifiers()

    const typeAnnotation = this.typeRule.parse(context)
    let multiplicity: string | undefined

    if (context.match(TokenType.LBRACKET)) {
      multiplicity = ''
      while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
        multiplicity += context.advance().value
      }
      context.consume(TokenType.RBRACKET, "Expected ']'")
    }

    return {
      type: ASTNodeType.ATTRIBUTE,
      name: name.value,
      visibility,
      modifiers,
      typeAnnotation,
      multiplicity,
      relationshipKind,
      targetModifiers,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column,
    }
  }
}
