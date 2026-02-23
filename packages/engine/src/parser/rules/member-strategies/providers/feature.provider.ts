import { TokenType } from '../../../../syntax/token.types'
import type { MemberNode } from '../../../../syntax/nodes'
import type { IParserHub } from '../../../core/parser.hub'
import { AttributeRule } from '../../attribute.rule'
import { MethodRule } from '../../method.rule'
import { ModifierRule } from '../../modifier.rule'
import type { IMemberProvider } from '../../../core/member-provider.interface'
import { Orchestrator } from '../../../rule.types'

export class FeatureMemberProvider implements IMemberProvider {
  private readonly attributeRule = new AttributeRule()
  private readonly methodRule = new MethodRule()

  canHandle(context: IParserHub): boolean {
    return context.checkAny(
      TokenType.VIS_PUB,
      TokenType.VIS_PRIV,
      TokenType.VIS_PROT,
      TokenType.VIS_PACK,
      TokenType.KW_PUBLIC,
      TokenType.KW_PRIVATE,
      TokenType.KW_PROTECTED,
      TokenType.KW_INTERNAL,
      TokenType.KW_STATIC,
      TokenType.KW_ABSTRACT,
      TokenType.KW_ACTIVE,
      TokenType.KW_LEAF,
      TokenType.KW_FINAL,
      TokenType.KW_ROOT,
      TokenType.MOD_STATIC,
      TokenType.MOD_ABSTRACT,
      TokenType.MOD_ACTIVE,
      TokenType.MOD_LEAF,
      TokenType.MOD_ROOT,
      TokenType.IDENTIFIER,
    )
  }

  parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    let visibility = 'public'
    if (
      context.match(TokenType.VIS_PUB, TokenType.VIS_PRIV, TokenType.VIS_PROT, TokenType.VIS_PACK)
    ) {
      visibility = context.prev().value
    } else if (
      context.match(
        TokenType.KW_PUBLIC,
        TokenType.KW_PRIVATE,
        TokenType.KW_PROTECTED,
        TokenType.KW_INTERNAL,
      )
    ) {
      visibility = context.prev().value
    }

    const modifiers = ModifierRule.parse(context)
    const nameToken = context.consume(TokenType.IDENTIFIER, 'Expected member name')

    if (context.check(TokenType.LPAREN)) {
      return this.methodRule.parse(context, nameToken, visibility, modifiers, orchestrator)
    } else {
      return this.attributeRule.parse(context, nameToken, visibility, modifiers, orchestrator)
    }
  }
}
