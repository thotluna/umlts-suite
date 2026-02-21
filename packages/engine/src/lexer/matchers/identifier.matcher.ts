import { AbstractCompositeMatcher } from './base.composite'
import { GeneralIdentifierMatcher } from './general.identifier.matcher'

/**
 * Composite matcher for identifiers and keywords.
 */
export class IdentifierMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new GeneralIdentifierMatcher())
  }
}
