import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { StatementRule } from '@engine/parser/rule.types'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import type {
  IPrimaryTypeProvider,
  ITypeModifierProvider,
} from '@engine/parser/core/type-provider.interface'
import type { ICapability } from './plugin.types'

/**
 * ILanguageCapability: Capability that allows a plugin to extend the language.
 * Accessed via getCapability('language').
 */
export interface ILanguageCapability extends ICapability {
  readonly __capabilityKind: 'language'

  /**
   * Initial configuration method for the language capability.
   */
  setup(api: ILanguageAPI): void
}

/**
 * ILanguageAPI: Interface exposed by the engine so plugins
 * can inject their pieces into different pipeline phases.
 */
export interface ILanguageAPI {
  /**
   * Registers a new matcher in the Lexer. Allows recognizing new symbols.
   */
  addTokenMatcher(matcher: TokenMatcher): void

  /**
   * Registers a top-level rule in the Parser.
   * Allows adding new types of blocks or statements.
   */
  addStatementRule(rule: StatementRule): void

  /**
   * Registers a member provider for classes and interfaces.
   * Allows extending how the internal content of an entity is parsed.
   */
  addMemberProvider(provider: IMemberProvider): void

  /**
   * Registers a primary type provider (e.g., union types, function types).
   */
  addTypePrimary(provider: IPrimaryTypeProvider): void

  /**
   * Registers a type modifier (e.g., generics, pointers, optionals).
   */
  addTypeModifier(modifier: ITypeModifierProvider): void

  /**
   * Registers primitive type names that the engine should consider pre-existing
   * (e.g., 'int', 'string', 'Promise').
   */
  registerPrimitiveTypes(types: string[]): void

  /**
   * Registers a strategy for resolving types (e.g., mapping 'int' to 'Integer').
   */
  addTypeResolutionStrategy(
    strategy: import('@engine/semantics/inference/type-resolver.types').ITypeResolutionStrategy,
  ): void
}
