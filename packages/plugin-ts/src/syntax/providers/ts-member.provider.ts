import {
  IMemberProvider,
  IParserHub,
  Orchestrator,
  MemberNode,
  TokenType,
  AttributeRule,
  MethodRule,
  ModifierRule,
} from '@umlts/engine'

/**
 * TSMemberProvider: Handles TypeScript-specific modifiers like 'async'.
 */
export class TSMemberProvider implements IMemberProvider {
  private readonly attributeRule = new AttributeRule()
  private readonly methodRule = new MethodRule()

  public canHandle(context: IParserHub): boolean {
    const pos = context.getPosition()
    this.skipVisibility(context)
    const next = context.peek()
    const isTSKeyword =
      (next.type === TokenType.IDENTIFIER && next.value === 'async') ||
      next.type === TokenType.KW_READONLY
    context.rollback(pos)
    return isTSKeyword
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    const visibility = this.parseVisibility(context)

    // Consume TS-specific modifiers
    let found = true
    while (found) {
      found = false
      const next = context.peek()
      if (next.type === TokenType.IDENTIFIER && next.value === 'async') {
        context.advance()
        found = true
      } else if (next.type === TokenType.KW_READONLY) {
        context.advance()
        found = true
      }
    }

    // Standard modifiers (static, abstract, etc.)
    const modifiers = ModifierRule.parse(context)

    // Parse name
    const nameToken = context.consume(TokenType.IDENTIFIER, 'Expected member name')

    if (context.check(TokenType.LPAREN)) {
      return this.methodRule.parse(context, nameToken, visibility, modifiers, orchestrator)
    } else {
      return this.attributeRule.parse(context, nameToken, visibility, modifiers, orchestrator)
    }
  }

  private isVisibility(type: TokenType): boolean {
    return [
      TokenType.VIS_PUB,
      TokenType.VIS_PRIV,
      TokenType.VIS_PROT,
      TokenType.VIS_PACK,
      TokenType.KW_PUBLIC,
      TokenType.KW_PRIVATE,
      TokenType.KW_PROTECTED,
      TokenType.KW_INTERNAL,
    ].includes(type)
  }

  private parseVisibility(context: IParserHub): string {
    if (this.isVisibility(context.peek().type)) {
      return context.advance().value
    }
    return 'public'
  }

  private skipVisibility(context: IParserHub): void {
    if (this.isVisibility(context.peek().type)) {
      context.advance()
    }
  }
}
