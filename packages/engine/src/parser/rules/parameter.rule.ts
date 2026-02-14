import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, type ParameterNode } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import { TypeRule } from './type.rule'

export class ParameterRule {
  private readonly typeRule = new TypeRule()

  public parse(context: ParserContext): ParameterNode {
    const paramName = context.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre del parámetro')
    context.consume(TokenType.COLON, "Se esperaba ':'")

    // SOPORTE SECCIÓN 5.3: Operadores de relación en parámetros
    let relationshipKind: string | undefined
    if (
      context.match(
        TokenType.OP_INHERIT,
        TokenType.OP_IMPLEMENT,
        TokenType.OP_COMP,
        TokenType.OP_AGREG,
        TokenType.OP_USE,
        TokenType.GT,
      )
    ) {
      relationshipKind = context.prev().value
    }

    const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)
    const typeAnnotation = this.typeRule.parse(context)
    let multiplicity: string | undefined

    if (context.check(TokenType.LBRACKET)) {
      multiplicity = '['
      context.advance()
      while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
        multiplicity += context.advance().value
      }
      multiplicity += context.consume(TokenType.RBRACKET, "Se esperaba ']'").value
    }

    return {
      type: ASTNodeType.PARAMETER,
      name: paramName.value,
      typeAnnotation,
      relationshipKind,
      targetIsAbstract,
      multiplicity,
      line: paramName.line,
      column: paramName.column,
    }
  }
}
