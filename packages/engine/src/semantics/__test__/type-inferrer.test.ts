import { describe, it, expect, beforeEach } from 'vitest'
import { TypeInferrer } from '@engine/semantics/analyzers/type-inferrer'
import { registerDefaultInferenceRules } from '@engine/semantics/rules/inference-rules'
import { IREntityType, IRRelationshipType } from '@engine/generator/ir/models'

describe('TypeInferrer', () => {
  let inferrer: TypeInferrer

  beforeEach(() => {
    inferrer = new TypeInferrer()
    registerDefaultInferenceRules(inferrer)
  })

  it('should infer INTERFACE when a CLASS IMPLEMENTS something', () => {
    const result = inferrer.infer(IREntityType.CLASS, IRRelationshipType.IMPLEMENTATION)
    expect(result).toBe(IREntityType.INTERFACE)
  })

  it('should infer INTERFACE when an INTERFACE INHERITS (extends) something', () => {
    const result = inferrer.infer(IREntityType.INTERFACE, IRRelationshipType.INHERITANCE)
    expect(result).toBe(IREntityType.INTERFACE)
  })

  it('should infer CLASS when a CLASS INHERITS something', () => {
    const result = inferrer.infer(IREntityType.CLASS, IRRelationshipType.INHERITANCE)
    expect(result).toBe(IREntityType.CLASS)
  })

  it('should infer INTERFACE for interface dependencies', () => {
    const result = inferrer.infer(IREntityType.INTERFACE, IRRelationshipType.DEPENDENCY)
    expect(result).toBe(IREntityType.INTERFACE)
  })

  it('should infer CLASS for general relationships (Association, Composition, etc)', () => {
    expect(inferrer.infer(IREntityType.CLASS, IRRelationshipType.ASSOCIATION)).toBe(
      IREntityType.CLASS,
    )
    expect(inferrer.infer(IREntityType.CLASS, IRRelationshipType.COMPOSITION)).toBe(
      IREntityType.CLASS,
    )
    expect(inferrer.infer(IREntityType.CLASS, IRRelationshipType.AGGREGATION)).toBe(
      IREntityType.CLASS,
    )
  })

  it('should return undefined for unregistered combinations (if any exist)', () => {
    // We registered almost everything, but let's try a weird one if possible
    // e.g. An Component (if it existed) or just verify manual override works

    // Let's manually clearing rules to test undefined behavior
    const emptyInferrer = new TypeInferrer()
    const result = emptyInferrer.infer(IREntityType.CLASS, IRRelationshipType.Dependency)
    expect(result).toBeUndefined()
  })
})
