import { AbstractCompositeMatcher } from '@engine/lexer/matchers/base.composite'
import { BlockCommentMatcher } from '@engine/lexer/matchers/block.comment.matcher'
import { LineCommentMatcher } from '@engine/lexer/matchers/line.comment.matcher'

/**
 * Composite matcher for all types of comments.
 */
export class CommentMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new LineCommentMatcher(), new BlockCommentMatcher())
  }
}
