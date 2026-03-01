import { TokenType } from '@engine/syntax/token.types'
import type { StereotypeNode, StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'
import { StereotypeRule } from '@engine/parser/rules/stereotype.rule'

/**
 * ProfileRule: Parsea el bloque 'profile Name { ... }'
 */
export class ProfileRule implements StatementRule {
  private readonly stereotypeRule = new StereotypeRule()

  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.KW_PROFILE)
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    const startToken = context.consume(TokenType.KW_PROFILE, "Expected 'profile'")
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Profile name expected')

    const body: StereotypeNode[] = []

    if (context.match(TokenType.LBRACE)) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        if (this.stereotypeRule.canHandle(context)) {
          body.push(this.stereotypeRule.parse(context, orchestrator))
        } else {
          context.addError('Only stereotypes are allowed inside a profile', context.peek())
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}' for profile closing")
    } else {
      context.addError("Expected '{' after profile name")
    }

    return [ASTFactory.createProfile(nameToken.value, body, startToken.line, startToken.column)]
  }
}
