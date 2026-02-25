import { describe, it, expect, vi } from 'vitest'
import { PluginRegistry } from '../plugin.registry'
import type { IUMLPlugin, ICapability } from '../plugin.types'
import type { ILanguageAPI } from '../language.types'

describe('PluginRegistry', () => {
  it('should initialize language extension on construction', () => {
    const setupSpy = vi.fn()
    const mockPlugin: IUMLPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      getCapability: <T extends ICapability>(name: string): T | undefined => {
        if (name === 'language') {
          return {
            __capabilityKind: 'language',
            setup: (api: ILanguageAPI) => {
              setupSpy(api)
              api.registerPrimitiveTypes(['int'])
            },
          } as unknown as T
        }
        return undefined
      },
    }

    const registry = new PluginRegistry([mockPlugin])

    // In the new design, initialization happens in constructor for simplicity
    // or we can keep it lazy if preferred, but here we called ensureInitialized in constructor
    expect(setupSpy).toHaveBeenCalledOnce()
    expect(registry.language.getPrimitiveTypes()).toContain('int')
  })

  it('should throw error if multiple plugins provide the same capability', () => {
    const mockPlugin1: IUMLPlugin = {
      name: 'p1',
      version: '1',
      getCapability: <T extends ICapability>(name: string): T | undefined =>
        name === 'language'
          ? ({ __capabilityKind: 'language', setup: () => {} } as unknown as T)
          : undefined,
    }
    const mockPlugin2: IUMLPlugin = {
      name: 'p2',
      version: '1',
      getCapability: <T extends ICapability>(name: string): T | undefined =>
        name === 'language'
          ? ({ __capabilityKind: 'language', setup: () => {} } as unknown as T)
          : undefined,
    }

    expect(() => new PluginRegistry([mockPlugin1, mockPlugin2])).toThrow(
      /Multiple plugins provide the 'language' capability/,
    )
  })

  it('should call onDestroy on all plugins when destroyed', () => {
    const destroySpy = vi.fn()
    const mockPlugin: IUMLPlugin = {
      name: 'p1',
      version: '1',
      onDestroy: destroySpy,
    }

    const registry = new PluginRegistry([mockPlugin])
    registry.destroy()

    expect(destroySpy).toHaveBeenCalledOnce()
  })
})
