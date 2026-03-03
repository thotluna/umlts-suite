import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { RelationshipMatcher } from '@engine/lexer/matchers/relationship.matcher'
import { RangeMatcher } from '@engine/lexer/matchers/range.matcher'
import { SimpleSymbolMatcher } from '@engine/lexer/matchers/simple.symbol.matcher'
import { RelationshipBidirMatcher } from './Relationship.bidir.matcher'
import { LabelMatcher } from './label.matcher'

/**
 * Composite matcher for all symbols and operators.
 */
export class SymbolMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(
      new RelationshipMatcher(),
      new RelationshipBidirMatcher(),
      new RangeMatcher(),
      new LabelMatcher(),
      new SimpleSymbolMatcher(),
    )
  }
}
