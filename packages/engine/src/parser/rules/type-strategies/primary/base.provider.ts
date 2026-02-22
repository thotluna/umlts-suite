import { TokenType } from '../../../../syntax/token.types'
import { ASTNodeType, type TypeNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../parser.hub'
import type { TypeRule } from '../../type.rule'
import type { IPrimaryTypeProvider } from '../type-strategy.interface'

export class BaseTypeProvider implements IPrimaryTypeProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.IDENTIFIER)
  }

  parse(context: IParserHub, _typeRule: TypeRule): TypeNode {
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
