import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { SimpleWhitespaceMatcher } from '@engine/lexer/matchers/simple.whitespace.matcher'

/**
 * Composite matcher for whitespace.
 */
export class WhitespaceMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new SimpleWhitespaceMatcher())
  }
}
