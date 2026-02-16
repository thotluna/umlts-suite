import { TokenType } from '../../lexer/token.types'
import type { StatementNode, PackageNode } from '../ast/nodes'
import { ASTNodeType } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'

export class PackageRule implements StatementRule {
  public canStart(context: ParserContext): boolean {
    return context.check(TokenType.KW_PACKAGE)
  }

  public parse(context: ParserContext, orchestrator: Orchestrator): PackageNode | null {
    if (!context.check(TokenType.KW_PACKAGE)) return null

    const startToken = context.consume(TokenType.KW_PACKAGE, "Expected 'package'")
    // Si falta el nombre, registramos el error pero seguimos adelante con un placeholder
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Package name expected')

    // Si falta la llave, registramos el error. Si no está, el bucle de abajo probablemente no se ejecute
    // o se recupere en el siguiente token válido.
    const hasLBrace = context.match(TokenType.LBRACE)
    if (!hasLBrace) {
      context.addError("Expected '{' after package name")
    }

    const body: StatementNode[] = []
    if (hasLBrace) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const stmt = orchestrator.parseStatement(context)
        if (stmt != null) {
          if (Array.isArray(stmt)) {
            body.push(...stmt)
          } else {
            body.push(stmt)
          }
        } else {
          // Si no hay match y no es fin de bloque, algo va mal.
          // En modo tolerante, registramos el error y saltamos el token problemático.
          context.addError('Unrecognized statement inside package', context.peek())
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}' for package closing")
    }

    return {
      type: ASTNodeType.PACKAGE,
      name: nameToken.value,
      body,
      line: startToken.line,
      column: startToken.column,
    }
  }
}
