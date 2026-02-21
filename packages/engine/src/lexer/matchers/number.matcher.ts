import { AbstractCompositeMatcher } from './base.composite'
import { IntegerMatcher } from './integer.matcher'

/**
 * Composite matcher for numbers.
 */
export class NumberMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new IntegerMatcher())
  }
}
