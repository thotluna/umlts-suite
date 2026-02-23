import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { QuotedStringMatcher } from '@engine/lexer/matchers/quoted.string.matcher'

/**
 * Composite matcher for strings (supports single and double quotes).
 */
export class StringMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new QuotedStringMatcher('"'), new QuotedStringMatcher("'"))
  }
}
