import { AbstractCompositeMatcher } from './base.composite'
import { RelationshipMatcher } from './relationship.matcher'
import { KeywordOperatorMatcher } from './keyword.operator.matcher'
import { RangeMatcher } from './range.matcher'
import { BidirAssociationMatcher } from './bidir.association.matcher'
import { SimpleSymbolMatcher } from './simple.symbol.matcher'

/**
 * Composite matcher for all symbols and operators.
 */
export class SymbolMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(
      new RelationshipMatcher(),
      new KeywordOperatorMatcher(),
      new RangeMatcher(),
      new BidirAssociationMatcher(),
      new SimpleSymbolMatcher(),
    )
  }
}
