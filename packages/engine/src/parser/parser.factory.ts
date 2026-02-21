import type { LanguagePlugin } from '../plugins/language-plugin'
import { Parser } from './parser'
import { CommentRule } from './rules/comment.rule'
import { PackageRule } from './rules/package.rule'
import { EntityRule } from './rules/entity.rule'
import { RelationshipRule } from './rules/relationship.rule'
import { ConfigRule } from './rules/config.rule'
import { ConstraintRule } from './rules/constraint.rule'
import { DocCommentRule } from './rules/doc-comment.rule'
import { NoteRule } from './rules/note.rule'
import { LinkRule } from './rules/link.rule'
import { PluginStatementRule } from './rules/plugin-statement.rule'
import { PluginMemberProvider } from './rules/plugin-member.provider'
import { MemberRegistry } from './rules/member-strategies/member.registry'
import type { StatementRule } from './rule.types'

export class ParserFactory {
  /**
   * Crea una instancia del Parser con las reglas estándar de UMLTS.
   */
  public static create(plugin?: LanguagePlugin): Parser {
    const rules: StatementRule[] = [
      new ConfigRule(),
      new ConstraintRule(),
      new DocCommentRule(),
      new CommentRule(),
      new NoteRule(),
      new LinkRule(),
      new PackageRule(),
      new EntityRule(),
      new RelationshipRule(),
    ]

    if (plugin) {
      rules.push(new PluginStatementRule(plugin))
      MemberRegistry.registerProvider(new PluginMemberProvider(plugin))
    }

    return new Parser(rules)
  }
}
