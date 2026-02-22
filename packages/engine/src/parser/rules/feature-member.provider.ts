import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type MemberNode } from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'
import type { IOrchestrator, MemberProvider } from '../rule.types'

/**
 * Default provider for attributes and methods.
 */
export class FeatureMemberProvider implements MemberProvider {
  public canHandle(context: IParserHub): boolean {
    const isDoc = context.check(TokenType.DOC_COMMENT)
    if (isDoc) return false

    // We only take responsibility if we see clear feature indicators:
    // visibility, modifiers, or identifier followed by ( or :
    if (
      context.check(
        TokenType.VIS_PUB,
        TokenType.VIS_PRIV,
        TokenType.VIS_PROT,
        TokenType.VIS_PACK,
        TokenType.MOD_STATIC,
        TokenType.KW_STATIC,
        TokenType.MOD_LEAF,
        TokenType.KW_LEAF,
        TokenType.KW_FINAL,
        TokenType.MOD_ABSTRACT,
        TokenType.KW_ABSTRACT,
        TokenType.MOD_ACTIVE,
        TokenType.KW_ACTIVE,
        TokenType.MOD_QUERY,
        TokenType.KW_QUERY,
        TokenType.MOD_READONLY,
        TokenType.KW_READONLY,
      )
    ) {
      return true
    }

    // Heurística de lookahead: IDENTIFIER seguido de '(' o ':'
    if (context.check(TokenType.IDENTIFIER)) {
      const next = context.peek(1)
      if (next.type === TokenType.LPAREN || next.type === TokenType.COLON) {
        return true
      }
    }

    return false
  }

  public parse(context: IParserHub, orchestrator: IOrchestrator): MemberNode | null {
    const nodes = orchestrator.parseStatement(context)
    if (nodes.length > 0) {
      return nodes[0] as MemberNode
    }
    return null
  }
}
