import { describe, it, expect } from 'vitest'
import { UMLEngine } from '@engine/UMLEngine'
import type { IUMLPlugin, ICapability } from '@engine/plugin/plugin.types'
import type { ILanguageAPI } from '@engine/plugin/language.types'

describe('Full Pipeline Plugin Integration', () => {
  it('should support custom primitive types across the whole pipeline', () => {
    const mockPlugin: IUMLPlugin = {
      name: 'ts-lite-plugin',
      version: '1.0.0',
      getCapability: <T extends ICapability>(name: string): T | undefined => {
        if (name === 'language') {
          return {
            __capabilityKind: 'language',
            setup: (api: ILanguageAPI) => {
              // Register 'number' as a primitive
              api.registerPrimitiveTypes(['number', 'any'])
            },
          } as unknown as T
        }
        return undefined
      },
    }

    const engine = new UMLEngine([mockPlugin])

    // In UML Pure, 'number' would be an implicit entity (box)
    // With the plugin, it should be ignored by the inference engine as a primitive
    const result = engine.parse('class User { age : number }')

    expect(result.isValid).toBe(true)

    // Check if 'number' was created as an entity
    const hasNumberBox = result.diagram.entities.some((e) => e.name === 'number')
    expect(hasNumberBox).toBe(false)

    // Only 'User' should be there
    expect(result.diagram.entities).toHaveLength(1)
    expect(result.diagram.entities[0].name).toBe('User')
  })
})
