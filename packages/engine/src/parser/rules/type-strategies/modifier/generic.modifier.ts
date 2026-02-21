import { TokenType } from '../../../../syntax/token.types'
import type { TypeNode } from '../../../../syntax/nodes'
import type { ParserContext } from '../../../parser.context'
import type { TypeRule } from '../../type.rule'
import type { ITypeModifierProvider } from '../type-strategy.interface'

export class GenericTypeModifier implements ITypeModifierProvider {
  canHandle(context: ParserContext): boolean {
    return context.check(TokenType.LT)
  }

  apply(context: ParserContext, baseNode: TypeNode, typeRule: TypeRule): TypeNode {
    context.consume(TokenType.LT, '')
    baseNode.kind = 'generic'
    baseNode.raw += '<'
    baseNode.arguments = []

    do {
      if (context.match(TokenType.PIPE)) {
        baseNode.raw += ' | '
        continue
      }

      const argType = typeRule.parse(context)
      baseNode.arguments.push(argType)
      baseNode.raw += argType.raw

      if (context.check(TokenType.COMMA)) {
        context.advance()
        baseNode.raw += ', '
      }
    } while (!context.check(TokenType.GT) && !context.isAtEnd())

    baseNode.raw += context.consume(TokenType.GT, "Expected '>'").value
    return baseNode
  }
}
