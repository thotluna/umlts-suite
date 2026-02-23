import { TokenType } from '../../../../syntax/token.types'
import type { TypeNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../core/parser.hub'
import type { TypeRule } from '../../type.rule'
import type { ITypeModifierProvider } from '../../../core/type-provider.interface'
import { ASTFactory } from '../../../factory/ast.factory'

export class GenericTypeModifier implements ITypeModifierProvider {
  canHandle(context: IParserHub): boolean {
    return context.check(TokenType.LT)
  }

  apply(context: IParserHub, baseNode: TypeNode, typeRule: TypeRule): TypeNode {
    context.consume(TokenType.LT, '')
    const args: TypeNode[] = []
    let raw = baseNode.raw + '<'

    do {
      if (context.match(TokenType.PIPE)) {
        raw += ' | '
        continue
      }

      const argType = typeRule.parse(context)
      args.push(argType)
      raw += argType.raw

      if (context.check(TokenType.COMMA)) {
        context.advance()
        raw += ', '
      }
    } while (!context.check(TokenType.GT) && !context.isAtEnd())

    raw += context.consume(TokenType.GT, "Expected '>'").value

    return ASTFactory.createType(baseNode.name, 'generic', raw, baseNode.line, baseNode.column, {
      arguments: args,
    })
  }
}
