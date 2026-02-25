import { describe, it, expect } from 'vitest'
import { UMLEngine } from '@umlts/engine'
import { TypeScriptPlugin } from '@plugin-ts/index'

describe('TypeScript Semantic Domain Extension', () => {
  it('should resolve Partial<T> as a TS Maped Type rather than normal reference', () => {
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const source = `
      interface Test {
        field: Partial<Target>
      }
    `
    const { diagram, diagnostics } = engine.parse(source)

    expect(diagnostics).toHaveLength(0)

    // The field should just be of type "Partial<Target>" treated as a native primitive by TS
    // It should not generate missing relationship diagnostics.
    const testEntity = diagram.entities.find((e) => e.name === 'Test')
    expect(testEntity).toBeDefined()
    expect(testEntity!.properties[0].type).toBe('Partial<Target>')
  })
})
