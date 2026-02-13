import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, type TypeNode } from '../ast/nodes'
import type { ParserContext } from '../parser.context'

export class TypeRule {
  /**
   * Parsea un tipo UMLTS (puede ser simple, FQN, genérico o array).
   * Devuelve un objeto estructurado TypeNode.
   */
  public parse(context: ParserContext): TypeNode {
    const token = context.peek()

    if (token.type !== TokenType.IDENTIFIER) {
      throw new Error(`Se esperaba un tipo en línea ${token.line}, columna ${token.column}`)
    }

    let raw = context.advance().value
    let name = raw
    let kind: 'simple' | 'generic' | 'array' = 'simple'
    let args: TypeNode[] | undefined

    // Soporte para FQN (Fully Qualified Names): core.DiagramNode
    while (context.match(TokenType.DOT)) {
      const nextPart = context.consume(
        TokenType.IDENTIFIER,
        'Se esperaba un identificador después del punto',
      )
      raw += '.' + nextPart.value
      name = raw // En FQN, el nombre incluye el path
    }

    // Soporte para genéricos: Tipo<T, K>
    if (context.match(TokenType.LT)) {
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

      raw += context.consume(TokenType.GT, "Se esperaba '>'").value
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
      line: token.line,
      column: token.column,
    }
  }
}
