import { TokenType } from '@engine/syntax/token.types'
import { type TypeNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { TypeRule } from '@engine/parser/rules/type.rule'
import type { IPrimaryTypeProvider } from '@engine/parser/core/type-provider.interface'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

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

    return ASTFactory.createType(name, 'simple', raw, token.line, token.column)
  }
}
