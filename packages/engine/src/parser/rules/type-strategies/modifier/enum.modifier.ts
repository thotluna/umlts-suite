import { TokenType } from '../../../../syntax/token.types'
import type { TypeNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../parser.context'
import type { TypeRule } from '../../type.rule'
import type { ITypeModifierProvider } from '../type-strategy.interface'

export class EnumTypeModifier implements ITypeModifierProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.LPAREN)
  }

  apply(context: IParserHub, baseNode: TypeNode, _typeRule: TypeRule): TypeNode {
    context.consume(TokenType.LPAREN, '')
    baseNode.kind = 'enum'
    baseNode.values = []
    baseNode.raw += '('

    while (!context.check(TokenType.RPAREN) && !context.isAtEnd()) {
      if (context.check(TokenType.IDENTIFIER)) {
        const val = context.consume(TokenType.IDENTIFIER, '').value
        baseNode.values?.push(val)
        baseNode.raw += val
      } else if (context.match(TokenType.PIPE)) {
        baseNode.raw += ' | '
      } else {
        context.advance()
      }
    }

    baseNode.raw += context.consume(TokenType.RPAREN, "Expected ')'").value
    return baseNode
  }
}
