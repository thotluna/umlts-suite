import { Lexer } from '@engine/lexer/lexer'
import { LexerReader } from '@engine/lexer/lexer.reader'
import type { LanguagePlugin } from '@engine/plugins/language-plugin'
import { WhitespaceMatcher } from '@engine/lexer/matchers/whitespace.matcher'
import { CommentMatcher } from '@engine/lexer/matchers/comment.matcher'
import { IdentifierMatcher } from '@engine/lexer/matchers/identifier.matcher'
import { NumberMatcher } from '@engine/lexer/matchers/number.matcher'
import { SymbolMatcher } from '@engine/lexer/matchers/symbol.matcher'
import { StringMatcher } from '@engine/lexer/matchers/string.matcher'
import { MasterMatcher } from '@engine/lexer/matchers/master.matcher'

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
