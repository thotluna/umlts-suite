import type { LanguagePlugin } from '@engine/plugins/language-plugin'
import { Parser } from '@engine/parser/parser'
import { CommentRule } from '@engine/parser/rules/comment.rule'
import { PackageRule } from '@engine/parser/rules/package.rule'
import { ClassRule } from '@engine/parser/rules/class.rule'
import { InterfaceRule } from '@engine/parser/rules/interface.rule'
import { RelationshipRule } from '@engine/parser/rules/relationship.rule'
import { EnumRule } from '@engine/parser/rules/enum.rule'
import { AssociationClassRule } from '@engine/parser/rules/association-class.rule'
import { ConfigRule } from '@engine/parser/rules/config.rule'
import { ConstraintRule } from '@engine/parser/rules/constraint.rule'
import { DocCommentRule } from '@engine/parser/rules/doc-comment.rule'
import { NoteRule } from '@engine/parser/rules/note.rule'
import { LinkRule } from '@engine/parser/rules/link.rule'
import { PluginStatementRule } from '@engine/parser/rules/plugin-statement.rule'
import { PluginMemberProvider } from '@engine/parser/rules/plugin-member.provider'
import { MemberRegistry } from '@engine/parser/rules/member-strategies/member.registry'
import { TypeRegistry } from '@engine/parser/rules/type-strategies/type.registry'
import type { StatementRule } from '@engine/parser/rule.types'

export class ParserFactory {
  /**
   * Crea una instancia del Parser con las reglas estándar de UMLTS.
   */
  public static create(plugin?: LanguagePlugin): Parser {
    const members = new MemberRegistry()
    const types = new TypeRegistry()

    const rules: StatementRule[] = [
      new ConfigRule(),
      new ConstraintRule(),
      new DocCommentRule(),
      new CommentRule(),
      new NoteRule(),
      new LinkRule(),
      new PackageRule(),
      new EnumRule(),
      new AssociationClassRule(),
      new ClassRule(),
      new InterfaceRule(),
      new RelationshipRule(),
    ]

    if (plugin) {
      rules.push(new PluginStatementRule(plugin))
      members.registerProvider(new PluginMemberProvider(plugin))
    }

    return new Parser(rules, members, types)
  }
}
