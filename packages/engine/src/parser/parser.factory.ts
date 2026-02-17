import { Parser } from './parser'
import { CommentRule } from './rules/comment.rule'
import { PackageRule } from './rules/package.rule'
import { EntityRule } from './rules/entity.rule'
import { RelationshipRule } from './rules/relationship.rule'
import { ConfigRule } from './rules/config.rule'
import { ConstraintRule } from './rules/constraint.rule'

import { DocCommentRule } from './rules/doc-comment.rule'

export class ParserFactory {
  /**
   * Crea una instancia del Parser con las reglas estándar de UMLTS.
   */
  public static create(): Parser {
    const rules = [
      new ConfigRule(),
      new ConstraintRule(),
      new DocCommentRule(),
      new CommentRule(),
      new PackageRule(),
      new EntityRule(),
      new RelationshipRule(),
    ]
    return new Parser(rules)
  }
}
