/**
 * IUMLPlugin: Base interface for all plugins in the UMLTS ecosystem.
 * Defines the minimum identity and the capability discovery mechanism.
 */
export interface IUMLPlugin {
  /**
   * Unique name of the plugin (e.g., '@umlts/plugin-typescript').
   */
  readonly name: string

  /**
   * Plugin version following semantic versioning (semver).
   */
  readonly version: string

  /**
   * getCapability: Mechanism for discovering specific features.
   * The engine requests a capability by name (e.g., 'language').
   * If the plugin supports it, it returns the implementation of that capability.
   *
   * @param name Name of the requested capability.
   * @returns The capability implementation or undefined if not supported.
   */
  getCapability?<T extends ICapability>(name: string): T | undefined

  /**
   * Optional cleanup method called when the engine is destroyed.
   */
  onDestroy?(): void
}

/**
 * ICapability: Base interface for all plugin capabilities.
 * Ensures that every capability returned by getCapability has at least
 * a basic structure or provides a hook for future metadata.
 */
export interface ICapability {
  /**
   * Internal capability identifier.
   */
  readonly __capabilityKind: string
}
