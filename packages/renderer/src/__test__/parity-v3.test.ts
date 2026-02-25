import { describe, it, expect } from 'vitest'
import { UMLRenderer } from '../renderer'
import { DiagramRenderer } from '../core/diagram-renderer'
import { LegacyIRProvider } from '../core/adapters/legacy-ir-provider'
import { LegacyClassLayout } from '../core/adapters/legacy-class-layout'
import { LegacySVGEngine } from '../core/adapters/legacy-svg-engine'
import { type IRDiagram, IREntityType, IRRelationshipType } from '@umlts/engine'

describe('Renderer V3 Parity Test', () => {
  const sampleIR: IRDiagram = {
    entities: [
      {
        id: 'User',
        name: 'User',
        type: IREntityType.CLASS,
        properties: [],
        operations: [],
        isImplicit: false,
        isAbstract: false,
        isStatic: false,
        isActive: false,
        isLeaf: false,
        isFinal: false,
        isRoot: false,
      },
      {
        id: 'Profile',
        name: 'Profile',
        type: IREntityType.CLASS,
        properties: [],
        operations: [],
        isImplicit: false,
        isAbstract: false,
        isStatic: false,
        isActive: false,
        isLeaf: false,
        isFinal: false,
        isRoot: false,
      },
    ],
    relationships: [
      {
        from: 'User',
        to: 'Profile',
        type: IRRelationshipType.ASSOCIATION,
        isNavigable: true,
      },
    ],
    constraints: [],
    config: {
      direction: 'RIGHT',
      spacing: 50,
    },
  }

  it('New DiagramRenderer (V3) should produce identical output to UMLRenderer (V2)', async () => {
    // OLD ROAD
    const oldRenderer = new UMLRenderer()
    const oldOutput = await oldRenderer.render(sampleIR)

    // NEW ROAD (V3)
    const newRenderer = new DiagramRenderer(
      new LegacyIRProvider(),
      new LegacyClassLayout(),
      new LegacySVGEngine(),
    )
    const newOutput = await newRenderer.render(sampleIR)

    expect(newOutput).toBe(oldOutput)
  })
})
