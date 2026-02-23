import { TokenType } from '../../syntax/token.types'
import { type StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { ASTFactory } from '../factory/ast.factory'

export class LinkRule implements StatementRule {
  public canStart(context: IParserHub): boolean {
    return context.check(TokenType.IDENTIFIER) && context.peekNext().type === TokenType.RANGE
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    if (!this.canStart(context)) return []
    const fromToken = context.consume(TokenType.IDENTIFIER, 'Expected origin identifier')

    let from = fromToken.value
    while (context.match(TokenType.DOT)) {
      from += '.' + context.consume(TokenType.IDENTIFIER, 'Expected identifier after .').value
    }

    context.consume(TokenType.RANGE, "Expected '..' anchor operator")

    const targets: string[] = []
    do {
      let target = context.consume(TokenType.IDENTIFIER, 'Expected target identifier').value
      while (context.match(TokenType.DOT)) {
        target += '.' + context.consume(TokenType.IDENTIFIER, 'Expected identifier after .').value
      }
      targets.push(target)
    } while (context.match(TokenType.COMMA))

    return [ASTFactory.createAnchor(from, targets, fromToken.line, fromToken.column)]
  }
}
