import { TokenType } from '@engine/syntax/token.types'
import type { TypeNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { TypeRule } from '@engine/parser/rules/type.rule'
import type { ITypeModifierProvider } from '@engine/parser/core/type-provider.interface'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

export class EnumTypeModifier implements ITypeModifierProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.LPAREN)
  }

  apply(context: IParserHub, baseNode: TypeNode, _typeRule: TypeRule): TypeNode {
    context.consume(TokenType.LPAREN, '')
    const values: string[] = []
    let raw = baseNode.raw + '('

    while (!context.check(TokenType.RPAREN) && !context.isAtEnd()) {
      const next = context.peek()
      if (next.type === TokenType.IDENTIFIER || next.type.startsWith('KW_')) {
        const valToken = context.advance()
        values.push(valToken.value)
        raw += valToken.value
      } else if (context.match(TokenType.PIPE)) {
        raw += ' | '
      } else {
        context.advance()
      }
    }

    raw += context.consume(TokenType.RPAREN, "Expected ')'").value
    return ASTFactory.createType(baseNode.name, 'enum', raw, baseNode.line, baseNode.column, {
      values,
    })
  }
}
