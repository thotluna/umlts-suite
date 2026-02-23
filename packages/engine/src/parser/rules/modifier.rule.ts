import { TokenType } from '../../syntax/token.types'
import type { Modifiers } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'

export class ModifierRule {
  /**
   * Parses modifiers from the current position in the token stream.
   */
  public static parse(context: IParserHub, modifiersOR?: Modifiers): Modifiers {
    const modifiers: Modifiers = {
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      ...(modifiersOR ?? {}),
    }

    ModifierRule.findModifiers(context, modifiers)

    return modifiers
  }

  private static findModifiers(context: IParserHub, modifiers: Modifiers): Modifiers {
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
        found = true
      }
      if (context.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
        modifiers.isRoot = true
        found = true
      }
    }
    return modifiers
  }

  /**
   * Identifica si un token es un modificador conocido (Keyword o Símbolo).
   */
  public static isModifier(type: TokenType): boolean {
    return [
      TokenType.MOD_ABSTRACT,
      TokenType.KW_ABSTRACT,
      TokenType.MOD_STATIC,
      TokenType.KW_STATIC,
      TokenType.MOD_ACTIVE,
      TokenType.KW_ACTIVE,
      TokenType.MOD_LEAF,
      TokenType.KW_LEAF,
      TokenType.KW_FINAL,
      TokenType.MOD_ROOT,
      TokenType.KW_ROOT,
    ].includes(type)
  }

  /**
   * Mira hacia adelante y devuelve cuántos modificadores consecutivos hay.
   */
  public static countModifiers(context: IParserHub, startOffset: number = 0): number {
    let count = 0
    while (ModifierRule.isModifier(context.lookahead(startOffset + count).type)) {
      count++
    }
    return count
  }
}
