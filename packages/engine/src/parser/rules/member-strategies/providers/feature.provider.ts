import { TokenType } from '@engine/syntax/token.types'
import type { MemberNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { AttributeRule } from '@engine/parser/rules/attribute.rule'
import { MethodRule } from '@engine/parser/rules/method.rule'
import { ModifierRule } from '@engine/parser/rules/modifier.rule'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import { Orchestrator } from '@engine/parser/rule.types'

export class FeatureMemberProvider implements IMemberProvider {
  private readonly attributeRule = new AttributeRule()
  private readonly methodRule = new MethodRule()

  canHandle(context: IParserHub): boolean {
    const type = context.peek().type
    return this.isVisibility(type) || ModifierRule.isModifier(type) || type === TokenType.IDENTIFIER
  }

  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    const visibility = this.parseVisibility(context)
    const modifiers = ModifierRule.parse(context)
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
}
