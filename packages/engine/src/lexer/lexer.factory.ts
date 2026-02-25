import { Lexer } from '@engine/lexer/lexer'
import { WhitespaceMatcher } from '@engine/lexer/matchers/whitespace.matcher'
import { CommentMatcher } from '@engine/lexer/matchers/comment.matcher'
import { IdentifierMatcher } from '@engine/lexer/matchers/identifier.matcher'
import { NumberMatcher } from '@engine/lexer/matchers/number.matcher'
import { SymbolMatcher } from '@engine/lexer/matchers/symbol.matcher'
import { StringMatcher } from '@engine/lexer/matchers/string.matcher'
import { MasterMatcher } from '@engine/lexer/matchers/master.matcher'
import type { TokenMatcher } from './matcher.types'

export class LexerFactory {
  /**
   * Creates a Lexer instance with standard UMLTS configuration and optional plugin matchers.
   * Standard UML matchers are prioritized, then plugin matchers are evaluated.
   */
  public static create(input: string, pluginMatchers: TokenMatcher[] = []): Lexer {
    const master = new MasterMatcher()

    // 1. Language Specialization Matchers (Plugins - High Priority)
    if (pluginMatchers.length > 0) {
      master.use(...pluginMatchers)
    }

    // 2. UML Pure Matchers (Standard)
    master.use(
      new WhitespaceMatcher(),
      new CommentMatcher(),
      new IdentifierMatcher(),
      new NumberMatcher(),
      new StringMatcher(),
      new SymbolMatcher(),
    )

    return new Lexer(input, master)
  }
}
