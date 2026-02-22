import { TokenType } from '../../../../syntax/token.types'
import { ASTNodeType, type TypeNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../parser.hub'
import type { TypeRule } from '../../type.rule'
import type { IPrimaryTypeProvider } from '../type-strategy.interface'

export class XorTypeProvider implements IPrimaryTypeProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.KW_XOR)
  }

  parse(context: IParserHub, typeRule: TypeRule): TypeNode {
    const startToken = context.consume(TokenType.KW_XOR, '')
    let raw = 'xor'

    context.consume(TokenType.LBRACE, "Expected '{' after xor")
    raw += ' {'

    const args: TypeNode[] = []
    while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
      const t = typeRule.parse(context)
      args.push(t)
      raw += t.raw
      if (context.match(TokenType.COMMA)) raw += ', '
    }

    raw += context.consume(TokenType.RBRACE, "Expected '}' after xor types").value

    return {
      type: ASTNodeType.TYPE,
      kind: 'xor',
      name: 'xor',
      raw,
      arguments: args,
      line: startToken.line,
      column: startToken.column,
    }
  }
}
