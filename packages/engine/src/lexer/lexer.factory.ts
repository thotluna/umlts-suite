import { Lexer } from './lexer'
import { LexerReader } from './lexer.reader'
import type { LanguagePlugin } from '../plugins/language-plugin'
import { WhitespaceMatcher } from './matchers/whitespace.matcher'
import { CommentMatcher } from './matchers/comment.matcher'
import { IdentifierMatcher } from './matchers/identifier.matcher'
import { NumberMatcher } from './matchers/number.matcher'
import { SymbolMatcher } from './matchers/symbol.matcher'
import { StringMatcher } from './matchers/string.matcher'
import { MasterMatcher } from './matchers/master.matcher'

export class LexerFactory {
  /**
   * Crea una instancia del Lexer con la configuración estándar de UMLTS.
   */
  public static create(input: string, plugin?: LanguagePlugin): Lexer {
    const master = new MasterMatcher()

    master.use(
      new WhitespaceMatcher(),
      new CommentMatcher(),
      new IdentifierMatcher(),
      new NumberMatcher(),
      new StringMatcher(),
      new SymbolMatcher(),
    )

    // Si el plugin tiene lógica de lexing, lo añadimos como un matcher más
    if (plugin?.matchToken != null) {
      master.use({
        match: (reader: LexerReader) => plugin.matchToken!(reader),
      })
    }

    return new Lexer(input, master)
  }
}
