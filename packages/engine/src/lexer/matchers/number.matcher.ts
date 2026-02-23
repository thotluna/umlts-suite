import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { IntegerMatcher } from '@engine/lexer/matchers/integer.matcher'

/**
 * Composite matcher for numbers.
 */
export class NumberMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new IntegerMatcher())
  }
}
