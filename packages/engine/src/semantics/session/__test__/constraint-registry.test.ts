import { describe, it, expect, beforeEach } from 'vitest'
import { ConstraintRegistry } from '../constraint-registry'
import type { IRConstraint } from '../../../generator/ir/models'

describe('ConstraintRegistry', () => {
  let registry: ConstraintRegistry

  beforeEach(() => {
    registry = new ConstraintRegistry()
  })

  it('should add constraints', () => {
    const constraint: IRConstraint = { kind: 'xor', targets: ['A', 'B'] }
    registry.add(constraint)
    expect(registry.getAll()).toHaveLength(1)
    expect(registry.getAll()[0]).toEqual(constraint)
  })

  it('should ignore duplicate constraints', () => {
    const constraint1: IRConstraint = { kind: 'xor', targets: ['A', 'B'] }
    const constraint2: IRConstraint = { kind: 'xor', targets: ['A', 'B'] } // Duplicate by content

    registry.add(constraint1)
    registry.add(constraint2)

    expect(registry.getAll()).toHaveLength(1)
  })

  it('should add distinct constraints', () => {
    const constraint1: IRConstraint = { kind: 'xor', targets: ['A', 'B'] }
    const constraint2: IRConstraint = { kind: 'xor', targets: ['C', 'D'] }

    registry.add(constraint1)
    registry.add(constraint2)

    expect(registry.getAll()).toHaveLength(2)
  })

  it('should handle different order of targets as distinct (currently strictly equal)', () => {
    // Depending on implementation, JSON.stringify(['A', 'B']) != JSON.stringify(['B', 'A'])
    const constraint1: IRConstraint = { kind: 'xor', targets: ['A', 'B'] }
    const constraint2: IRConstraint = { kind: 'xor', targets: ['B', 'A'] }

    registry.add(constraint1)
    registry.add(constraint2)

    expect(registry.getAll()).toHaveLength(2)
  })
})
