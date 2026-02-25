import { describe, it, expect } from 'vitest'
import { TypeScriptPlugin } from '@plugin-ts/index'

describe('TypeScriptPlugin', () => {
  it('should have correct name and version', () => {
    const plugin = new TypeScriptPlugin()
    expect(plugin.name).toBe('@umlts/plugin-ts')
    expect(plugin.version).toBe('0.1.0')
  })

  it('should provide language capability', () => {
    const plugin = new TypeScriptPlugin()
    const capability = plugin.getCapability('language')
    expect(capability).toBeDefined()
    expect(capability?.__capabilityKind).toBe('language')
  })

  it('should return undefined for unknown capabilities', () => {
    const plugin = new TypeScriptPlugin()
    const capability = plugin.getCapability('unknown')
    expect(capability).toBeUndefined()
  })
})
