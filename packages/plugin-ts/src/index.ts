import { IUMLPlugin, ICapability, ILanguageCapability, ILanguageAPI } from '@umlts/engine'

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

    // Future iterations will register:
    // - TokenMatchers (Phase 7.2)
    // - StatementRules/MemberProviders (Phase 7.3)
    // - TypeResolutionStrategies (Phase 7.4)
  }
}
