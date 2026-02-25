import type { TokenMatcher } from '@engine/lexer/matcher.types'
import type { StatementRule } from '@engine/parser/rule.types'
import type { IMemberProvider } from '@engine/parser/core/member-provider.interface'
import type {
  IPrimaryTypeProvider,
  ITypeModifierProvider,
} from '@engine/parser/core/type-provider.interface'
import type { ILanguageAPI, ILanguageCapability } from './language.types'
import type { IUMLPlugin } from './plugin.types'

/**
 * LanguageExtension: Specialized container for language-specific plugin contributions.
 * Implements ILanguageAPI to collect matchers, rules, and providers.
 */
export class LanguageExtension implements ILanguageAPI {
  private isInitialized = false
  private readonly matchers: TokenMatcher[] = []
  private readonly statementRules: StatementRule[] = []
  private readonly memberProviders: IMemberProvider[] = []
  private readonly primaryProviders: IPrimaryTypeProvider[] = []
  private readonly typeModifiers: ITypeModifierProvider[] = []
  private readonly primitives: string[] = []
  private readonly resolutionStrategies: import('@engine/semantics/inference/type-resolver.types').ITypeResolutionStrategy[] =
    []

  /**
   * Orchestrates the initialization of the language capability from available plugins.
   * Ensures that only one plugin provides this capability.
   */
  public ensureInitialized(plugins: IUMLPlugin[]): void {
    if (this.isInitialized) return

    const providers = plugins.filter((p) => p.getCapability?.('language') !== undefined)

    if (providers.length > 1) {
      throw new Error(
        `Multiple plugins provide the 'language' capability: ${providers.map((p) => p.name).join(', ')}. Only one is allowed.`,
      )
    }

    if (providers.length === 1) {
      const cap = providers[0].getCapability!('language') as ILanguageCapability
      cap.setup(this)
    }

    this.isInitialized = true
  }

  // --- ILanguageAPI Implementation ---

  public addTokenMatcher(matcher: TokenMatcher): void {
    this.matchers.push(matcher)
  }

  public addStatementRule(rule: StatementRule): void {
    this.statementRules.push(rule)
  }

  public addMemberProvider(provider: IMemberProvider): void {
    this.memberProviders.push(provider)
  }

  public addTypePrimary(provider: IPrimaryTypeProvider): void {
    this.primaryProviders.push(provider)
  }

  public addTypeModifier(modifier: ITypeModifierProvider): void {
    this.typeModifiers.push(modifier)
  }

  public registerPrimitiveTypes(types: string[]): void {
    this.primitives.push(...types)
  }

  public addTypeResolutionStrategy(
    strategy: import('@engine/semantics/inference/type-resolver.types').ITypeResolutionStrategy,
  ): void {
    this.resolutionStrategies.push(strategy)
  }

  // --- Getters for the Engine ---

  public getMatchers(): TokenMatcher[] {
    return this.matchers
  }

  public getStatementRules(): StatementRule[] {
    return this.statementRules
  }

  public getMemberProviders(): IMemberProvider[] {
    return this.memberProviders
  }

  public getTypePrimaries(): IPrimaryTypeProvider[] {
    return this.primaryProviders
  }

  public getTypeModifiers(): ITypeModifierProvider[] {
    return this.typeModifiers
  }

  public getPrimitiveTypes(): string[] {
    return this.primitives
  }

  public getTypeResolutionStrategies(): import('@engine/semantics/inference/type-resolver.types').ITypeResolutionStrategy[] {
    return this.resolutionStrategies
  }
}
