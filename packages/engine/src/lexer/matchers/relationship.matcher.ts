import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { Token } from '@engine/syntax/token.types'
import { RelationshipInheritanceMatcher } from './relationship.Inheritance.matcher'
import { RelationshipAggregationMatcher } from './relationship.aggregation.matcher'
import { RelationshipAssocMatcher } from './relationship.assoc.matcher'
import { RelationshipImplementMatcher } from './relationship.implement.matcher'
import { RelationshipUseMatcher } from './relationship.use.matcher'
import { RelationshipCompositionMatcher } from './relationship.composition.matcher'

/**
 * Matches complex relationships starting with >
 */
export class RelationshipMatcher implements TokenMatcher {
  private matchers: TokenMatcher[] = [
    new RelationshipInheritanceMatcher(),
    new RelationshipImplementMatcher(),
    new RelationshipCompositionMatcher(),
    new RelationshipAggregationMatcher(),
    new RelationshipAssocMatcher(),
    new RelationshipUseMatcher(),
  ]

  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '>') return null

    // const startLine = reader.getLine()
    // const startColumn = reader.getColumn()
    const snap = reader.snapshot()

    for (const matcher of this.matchers) {
      const token = matcher.match(reader)
      if (token) return token
    }

    // reader.advance()
    // const next = reader.peek()

    // if (next === '>') {
    //   reader.advance()
    //   return { type: TokenType.OP_INHERIT, value: '>>', line: startLine, column: startColumn }
    // }
    // if (next.toUpperCase() === 'I') {
    //   reader.advance()
    //   return { type: TokenType.OP_IMPLEMENT, value: '>I', line: startLine, column: startColumn }
    // }
    // if (next === '*') {
    //   reader.advance()
    //   if (reader.peek() === '|') {
    //     reader.advance()
    //     return {
    //       type: TokenType.OP_COMP_NON_NAVIGABLE,
    //       value: '>*|',
    //       line: startLine,
    //       column: startColumn,
    //     }
    //   }
    //   return { type: TokenType.OP_COMP, value: '>*', line: startLine, column: startColumn }
    // }
    // if (next === '+') {
    //   reader.advance()
    //   if (reader.peek() === '|') {
    //     reader.advance()
    //     return {
    //       type: TokenType.OP_AGREG_NON_NAVIGABLE,
    //       value: '>+|',
    //       line: startLine,
    //       column: startColumn,
    //     }
    //   }
    //   return { type: TokenType.OP_AGREG, value: '>+', line: startLine, column: startColumn }
    // }
    // if (next === '<') {
    //   reader.advance()
    //   if (reader.peek() === '|') {
    //     reader.advance()
    //     return {
    //       type: TokenType.OP_ASSOC_NON_NAVIGABLE,
    //       value: '><|',
    //       line: startLine,
    //       column: startColumn,
    //     }
    //   }
    //   return { type: TokenType.OP_ASSOC, value: '><', line: startLine, column: startColumn }
    // }
    // if (next === '-') {
    //   reader.advance()
    //   return { type: TokenType.OP_USE, value: '>-', line: startLine, column: startColumn }
    // }

    reader.rollback(snap)
    return null
  }
}
