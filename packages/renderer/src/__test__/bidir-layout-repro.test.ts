import { describe, it, expect } from 'vitest'
import { UMLEngine } from '@umlts/engine'
import { UMLRenderer } from '../renderer'

describe('Bidir layout reproduction', () => {
  it('should not hang with <>', async () => {
    const code = `
class Hijo >> *Padre >I Madre{
    +hermana: >< Hermana
    +hermano: <> Hermano
}
`
    // 1. parse
    const engine = new UMLEngine()
    const result = engine.parse(code)
    expect(result.isValid).toBeDefined()

    // 2. render
    const renderer = new UMLRenderer()
    const svg = await renderer.render(result.diagram)
    expect(svg).toBeDefined()
  })
})
