import { describe, it, expect } from 'vitest'
import { UMLEngine } from '../UMLEngine'

describe('Bidir reproduction', () => {
  it('should not hang with <>', () => {
    const code = `
class Hijo >> *Padre >I Madre{
    +hermana: >< Hermana
    +hermano: <> Hermano
}
`
    const engine = new UMLEngine()
    const result = engine.parse(code)
    console.log(result.diagnostics)
    expect(result).toBeDefined()
  })
})
