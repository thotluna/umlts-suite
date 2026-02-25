import { IUMLPlugin, ICapability, ILanguageCapability, ILanguageAPI } from '@umlts/engine'
import { TSKeywordMatcher } from '@plugin-ts/lexical/ts-keyword.matcher'
import { TSNamespaceRule } from '@plugin-ts/syntax/rules/ts-namespace.rule'
import { TSTypeAliasRule } from '@plugin-ts/syntax/rules/ts-type-alias.rule'

/**
 * TypeScriptPlugin: Reference implementation of a language plugin for UMLTS.
 * Enables TypeScript-specific features like native primitives, utility types,
 * and advanced type resolution strategies.
 */
export class TypeScriptPlugin implements IUMLPlugin {
  public readonly name = '@umlts/plugin-ts'
  public readonly version = '0.1.0'

  /**
   * getCapability: Exposes the 'language' capability to the engine.
   */
  public getCapability<T extends ICapability>(name: string): T | undefined {
    if (name === 'language') {
      return new TSLanguageCapability() as unknown as T
    }
    return undefined
  }
}

/**
 * TSLanguageCapability: Implements the language extension points for TypeScript.
 */
class TSLanguageCapability implements ILanguageCapability {
  public readonly __capabilityKind = 'language'

  /**
   * setup: Configures the engine with TypeScript-specific metadata and logic.
   */
  public setup(api: ILanguageAPI): void {
    // 1. Register TypeScript standard primitive types
    api.registerPrimitiveTypes([
      'any',
      'unknown',
      'never',
      'void',
      'number',
      'string',
      'boolean',
      'object',
      'symbol',
      'bigint',
      'undefined',
      'null',
      'Record',
      'Partial',
      'Omit',
      'Pick',
      'Readonly',
      'Required',
      'Exclude',
      'Extract',
      'NonNullable',
    ])

    // 2. Extensión del Léxico (Fase 7.2)
    api.addTokenMatcher(new TSKeywordMatcher())

    // 3. Extensión de la Gramática (Fase 7.3)
    api.addStatementRule(new TSNamespaceRule())
    api.addStatementRule(new TSTypeAliasRule())

    // Future iterations will register:
    // - TypeResolutionStrategies (Phase 7.4)
  }
}
