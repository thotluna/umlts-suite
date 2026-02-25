import { TokenType, ASTNodeType, ASTFactory, MemberRule } from '@umlts/engine'
import type {
  StatementNode,
  IParserHub,
  StatementRule,
  Orchestrator,
  MemberNode,
  Modifiers,
} from '@umlts/engine'

/**
 * Parses block style type aliases:
 * type Name<T> = {
 *   prop: T
 * }
 */
export class TSTypeAliasRule implements StatementRule {
  private readonly memberRule = new MemberRule()

  public canHandle(context: IParserHub): boolean {
    // Also skip modifiers if any, though "type" statements usually don't have many
    return context.peek().type === TokenType.KW_TYPE
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    if (!context.check(TokenType.KW_TYPE)) return []

    const startToken = context.consume(TokenType.KW_TYPE, "Expected 'type'")
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Type name expected')

    const docs = context.consumePendingDocs()

    let typeParameters: string[] | undefined
    if (context.match(TokenType.LT)) {
      typeParameters = []
      do {
        const paramToken = context.softConsume(TokenType.IDENTIFIER, 'Type parameter name expected')
        typeParameters.push(paramToken.value)
      } while (context.match(TokenType.COMMA))
      context.softConsume(TokenType.GT, "Expected '>' after type parameters")
    }

    // TS uses "=" for type aliases
    context.softConsume(TokenType.EQUALS, "Expected '=' in type alias")

    // We can only parse object types with braces right now
    let body: MemberNode[] | undefined
    if (context.match(TokenType.LBRACE)) {
      body = []
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        try {
          const member = this.memberRule.parse(context, orchestrator)
          if (member != null) {
            body.push(member)
          } else {
            context.addError('Unrecognized member in type alias body', context.peek())
            context.advance()
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Error parsing member'
          context.addError(msg)
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}'")
    } else {
      // For now, if there is no Brace, we will just try to skip ahead or produce an empty body
      // We will enhance this in the future to handle Union / Intersection assignments
      context.addWarning('Type alias assignments currently support object syntax {...} only')
    }

    // Mapped as an interface with a specific stereotype in docs
    let finalDocs = docs || ''
    if (!finalDocs.includes('<<type>>')) {
      finalDocs = `<<type>>\n${finalDocs}`
    }

    return [
      ASTFactory.createEntity(
        ASTNodeType.INTERFACE,
        nameToken.value,
        {},
        [],
        body,
        startToken.line,
        startToken.column,
        finalDocs,
        typeParameters,
      ),
    ]
  }
}
