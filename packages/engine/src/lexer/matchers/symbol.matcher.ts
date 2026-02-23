import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { RelationshipMatcher } from '@engine/lexer/matchers/relationship.matcher'
import { KeywordOperatorMatcher } from '@engine/lexer/matchers/keyword.operator.matcher'
import { RangeMatcher } from '@engine/lexer/matchers/range.matcher'
import { BidirAssociationMatcher } from '@engine/lexer/matchers/bidir.association.matcher'
import { SimpleSymbolMatcher } from '@engine/lexer/matchers/simple.symbol.matcher'

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
