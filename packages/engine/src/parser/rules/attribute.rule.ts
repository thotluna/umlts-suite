import type { Token } from '../../syntax/token.types'
import { TokenType } from '../../syntax/token.types'
import {
  ASTNodeType,
  type AttributeNode,
  type Modifiers,
  type ConstraintNode,
} from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'
import { TypeRule } from './type.rule'
import { ConstraintRule } from './constraint.rule'

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
    let isNavigable: boolean | undefined
    if (
      context.match(
        TokenType.OP_INHERIT,
        TokenType.OP_IMPLEMENT,
        TokenType.OP_COMP,
        TokenType.OP_AGREG,
        TokenType.OP_COMP_NON_NAVIGABLE,
        TokenType.OP_AGREG_NON_NAVIGABLE,
        TokenType.OP_USE,
        TokenType.OP_ASSOC,
        TokenType.OP_ASSOC_BIDIR,
        TokenType.GT,
      )
    ) {
      const kindToken = context.prev()
      relationshipKind = kindToken.value
      isNavigable =
        kindToken.type !== TokenType.OP_COMP_NON_NAVIGABLE &&
        kindToken.type !== TokenType.OP_AGREG_NON_NAVIGABLE
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

    const constraints: ConstraintNode[] = []
    if (context.check(TokenType.LBRACE)) {
      constraints.push(ConstraintRule.parseInline(context))
    }

    return {
      type: ASTNodeType.ATTRIBUTE,
      name: name.value,
      visibility,
      modifiers,
      typeAnnotation,
      multiplicity,
      relationshipKind,
      isNavigable,
      constraints: constraints.length > 0 ? constraints : undefined,
      targetModifiers,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column,
    }
  }
}
