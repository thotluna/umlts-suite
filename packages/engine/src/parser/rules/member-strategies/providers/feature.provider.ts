import { TokenType } from '@engine/syntax/token.types'
import type { MemberNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { AttributeRule } from '@engine/parser/rules/attribute.rule'
import { MethodRule } from '@engine/parser/rules/method.rule'
import { ModifierRule } from '@engine/parser/rules/modifier.rule'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import { Orchestrator } from '@engine/parser/rule.types'
import { StereotypeApplicationRule } from '@engine/parser/rules/stereotype-application.rule'

export class FeatureMemberProvider implements IMemberProvider {
  private readonly attributeRule = new AttributeRule()
  private readonly methodRule = new MethodRule()

  canHandle(context: IParserHub): boolean {
    const type = context.peek().type
    return (
      this.isVisibility(type) ||
      ModifierRule.isModifier(type) ||
      type === TokenType.IDENTIFIER ||
      type === TokenType.AT
    )
  }

  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    const stereotypes = StereotypeApplicationRule.parse(context)
    const visibility = this.parseVisibility(context)
    const modifiers = ModifierRule.parse(context)
    const nameToken = context.consume(TokenType.IDENTIFIER, 'Expected member name')

    if (context.check(TokenType.LPAREN)) {
      const method = this.methodRule.parse(context, nameToken, visibility, modifiers, orchestrator)
      method.stereotypes = stereotypes
      return method
    } else {
      const attr = this.attributeRule.parse(context, nameToken, visibility, modifiers, orchestrator)
      attr.stereotypes = stereotypes
      return attr
    }
  }

  private isVisibility(type: TokenType): boolean {
    return [TokenType.VIS_PUB, TokenType.VIS_PRIV, TokenType.VIS_PROT, TokenType.VIS_PACK].includes(
      type,
    )
  }

  private parseVisibility(context: IParserHub): string {
    if (this.isVisibility(context.peek().type)) {
      return context.advance().value
    }
    return 'public'
  }
}
