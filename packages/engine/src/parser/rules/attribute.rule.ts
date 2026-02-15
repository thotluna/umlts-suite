import type { Token } from '../../lexer/token.types'
import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, type AttributeNode } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import { TypeRule } from './type.rule'

export class AttributeRule {
  private readonly typeRule = new TypeRule()

  public parse(
    context: ParserContext,
    name: Token,
    visibility: string,
    isStatic: boolean,
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

    const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)
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
      isStatic,
      typeAnnotation,
      multiplicity,
      relationshipKind,
      targetIsAbstract,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column,
    }
  }
}
