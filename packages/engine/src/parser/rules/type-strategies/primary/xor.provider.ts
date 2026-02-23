import { TokenType } from '@engine/syntax/token.types'
import { type TypeNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { TypeRule } from '@engine/parser/rules/type.rule'
import type { IPrimaryTypeProvider } from '@engine/parser/core/type-provider.interface'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

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

    return ASTFactory.createType('xor', 'xor', raw, startToken.line, startToken.column, {
      arguments: args,
    })
  }
}
