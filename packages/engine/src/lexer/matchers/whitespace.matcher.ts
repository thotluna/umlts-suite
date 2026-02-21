import { AbstractCompositeMatcher } from './base.composite'
import { SimpleWhitespaceMatcher } from './simple.whitespace.matcher'

/**
 * Composite matcher for whitespace.
 */
export class WhitespaceMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new SimpleWhitespaceMatcher())
  }
}
