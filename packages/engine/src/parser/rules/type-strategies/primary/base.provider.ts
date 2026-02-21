import { TokenType } from '../../../../syntax/token.types'
import { ASTNodeType, type TypeNode } from '../../../../syntax/nodes'
import type { ParserContext } from '../../../parser.context'
import type { TypeRule } from '../../type.rule'
import type { IPrimaryTypeProvider } from '../type-strategy.interface'

export class BaseTypeProvider implements IPrimaryTypeProvider {
  canHandle(context: ParserContext): boolean {
    return context.check(TokenType.IDENTIFIER)
  }

  parse(context: ParserContext, _typeRule: TypeRule): TypeNode {
    const token = context.peek()
    let raw = context.advance().value
    let name = raw

    while (context.match(TokenType.DOT)) {
      const nextPart = context.consume(TokenType.IDENTIFIER, 'Identifier expected after dot')
      raw += '.' + nextPart.value
      name = raw
    }

    return {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name,
      raw,
      line: token.line,
      column: token.column,
    }
  }
}
