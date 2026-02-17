import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type TypeNode } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'

export class TypeRule {
  /**
   * Parsea un tipo UMLTS (puede ser simple, FQN, genérico o array).
   * Devuelve un objeto estructurado TypeNode.
   */
  public parse(context: ParserContext): TypeNode {
    const token = context.peek()

    if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.KW_XOR) {
      throw new Error(`Expected type at line ${token.line}, column ${token.column}`)
    }

    let raw = context.advance().value
    let name = raw
    let kind: 'simple' | 'generic' | 'array' | 'enum' = 'simple'
    let args: TypeNode[] | undefined

    // Soporte para FQN (Fully Qualified Names): core.DiagramNode
    while (context.match(TokenType.DOT)) {
      const nextPart = context.consume(TokenType.IDENTIFIER, 'Identifier expected after dot')
      raw += '.' + nextPart.value
      name = raw // En FQN, el nombre incluye el path
    }

    // Soporte para enums inline: EnumName(VAL1 | VAL2)
    let values: string[] | undefined
    if (context.match(TokenType.LPAREN)) {
      kind = 'enum'
      values = []
      raw += '('

      while (!context.check(TokenType.RPAREN) && !context.isAtEnd()) {
        if (context.check(TokenType.IDENTIFIER)) {
          const val = context.consume(TokenType.IDENTIFIER, '').value
          values.push(val)
          raw += val
        } else if (context.match(TokenType.PIPE)) {
          raw += ' | '
        } else {
          context.advance()
        }
      }

      raw += context.consume(TokenType.RPAREN, "Expected ')' after enum values").value
    } else if (context.match(TokenType.LT)) {
      // Soporte para genéricos: Tipo<T, K>
      kind = 'generic'
      raw += '<'
      args = []

      do {
        const argType = this.parse(context) // Recursividad
        args.push(argType)
        raw += argType.raw

        if (context.check(TokenType.COMMA)) {
          context.advance()
          raw += ', '
        }
      } while (!context.check(TokenType.GT) && !context.isAtEnd())

      raw += context.consume(TokenType.GT, "Expected '>'").value
    }

    // Soporte para arrays: Tipo[] o Tipo<T>[]
    // Se puede encadenar: string[][]
    while (context.check(TokenType.LBRACKET)) {
      if (context.peekNext().type === TokenType.RBRACKET) {
        context.consume(TokenType.LBRACKET, '')
        context.consume(TokenType.RBRACKET, '')

        // El tipo anterior se convierte en el argumento del nuevo tipo array
        const innerType: TypeNode = {
          type: ASTNodeType.TYPE,
          kind,
          name,
          raw,
          arguments: args,
          line: token.line,
          column: token.column,
        }

        kind = 'array'
        name = 'Array'
        args = [innerType]
        raw += '[]'
      } else {
        break // Podría ser una multiplicidad, salimos
      }
    }

    return {
      type: ASTNodeType.TYPE,
      kind,
      name,
      raw,
      arguments: args,
      values,
      line: token.line,
      column: token.column,
    }
  }
}
