import { TokenType } from '../../syntax/token.types'
import { type StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'

import { ASTFactory } from '../factory/ast.factory'

export class PackageRule implements StatementRule {
  public canStart(context: IParserHub): boolean {
    return context.check(TokenType.KW_PACKAGE)
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    if (!context.check(TokenType.KW_PACKAGE)) return []

    const startToken = context.consume(TokenType.KW_PACKAGE, "Expected 'package'")
    // Si falta el nombre, registramos el error pero seguimos adelante con un placeholder
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Package name expected')

    const docs = context.consumePendingDocs()

    // Si falta la llave, registramos el error. Si no está, el bucle de abajo probablemente no se ejecute
    // o se recupere en el siguiente token válido.
    const hasLBrace = context.match(TokenType.LBRACE)
    if (!hasLBrace) {
      context.addError("Expected '{' after package name")
    }

    const body: StatementNode[] = []
    if (hasLBrace) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const startPos = context.getPosition()
        const nodes = orchestrator.parseStatement(context)
        if (nodes.length > 0) {
          body.push(...nodes)
        } else if (context.getPosition() === startPos) {
          // Si no hay match y no se avanzó el puntero, algo va mal.
          // En modo tolerante, registramos el error y saltamos el token problemático.
          context.addError('Unrecognized statement inside package', context.peek())
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}' for package closing")
    }

    return [
      ASTFactory.createPackage(nameToken.value, body, startToken.line, startToken.column, docs),
    ]
  }
}
