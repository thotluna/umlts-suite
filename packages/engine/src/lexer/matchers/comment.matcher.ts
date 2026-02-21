import { AbstractCompositeMatcher } from './base.composite'
import { BlockCommentMatcher } from './block.comment.matcher'
import { LineCommentMatcher } from './line.comment.matcher'

/**
 * Composite matcher for all types of comments.
 */
export class CommentMatcher extends AbstractCompositeMatcher {
  constructor() {
    super()
    this.use(new LineCommentMatcher(), new BlockCommentMatcher())
  }
}
