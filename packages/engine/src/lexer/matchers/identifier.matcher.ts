import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { GeneralIdentifierMatcher } from '@engine/lexer/matchers/general.identifier.matcher'

/**
 * Composite matcher for identifiers and keywords.
 */
export class IdentifierMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new GeneralIdentifierMatcher())
  }
}
