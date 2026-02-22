import { TokenType } from '../../syntax/token.types'
import type { Modifiers } from '../../syntax/nodes'
import type { IParserHub } from '../parser.context'

export class ModifierRule {
  /**
   * Parses modifiers from the current position in the token stream.
   */
  public static parse(context: IParserHub): Modifiers {
    const modifiers: Modifiers = {
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
    }

    let found = true
    while (found) {
      found = false
      if (context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)) {
        modifiers.isAbstract = true
        found = true
      }
      if (context.match(TokenType.MOD_STATIC, TokenType.KW_STATIC)) {
        modifiers.isStatic = true
        found = true
      }
      if (context.match(TokenType.MOD_ACTIVE, TokenType.KW_ACTIVE)) {
        modifiers.isActive = true
        found = true
      }
      if (context.match(TokenType.MOD_LEAF, TokenType.KW_LEAF)) {
        modifiers.isLeaf = true
        found = true
      }
      if (context.match(TokenType.KW_FINAL)) {
        modifiers.isFinal = true
        modifiers.isLeaf = true
        found = true
      }
      if (context.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
        modifiers.isRoot = true
        found = true
      }
    }
    return modifiers
  }
}
