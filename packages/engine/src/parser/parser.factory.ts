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
import { MemberRegistry } from '@engine/parser/rules/member-strategies/member.registry'
import { TypeRegistry } from '@engine/parser/rules/type-strategies/type.registry'
import type { StatementRule } from '@engine/parser/rule.types'
import type { LanguageExtension } from '@engine/plugin/language.extension'

export class ParserFactory {
  /**
   * Creates a Parser instance with standard UMLTS rules and plugin extensions.
   */
  public static create(language?: LanguageExtension): Parser {
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

    // Inject plugin contributions if present
    if (language) {
      // 1. External Statement Rules
      for (const rule of language.getStatementRules()) {
        rules.unshift(rule)
      }

      // 2. Member Providers
      for (const provider of language.getMemberProviders()) {
        members.registerProvider(provider)
      }

      // 3. Type Primaries
      for (const provider of language.getTypePrimaries()) {
        types.registerPrimary(provider)
      }

      // 4. Type Modifiers
      for (const modifier of language.getTypeModifiers()) {
        types.registerModifier(modifier)
      }
    }

    return new Parser(rules, members, types)
  }
}
