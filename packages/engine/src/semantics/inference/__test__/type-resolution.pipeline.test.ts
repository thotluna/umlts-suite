import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'
import type {
  ITypeResolutionStrategy,
  TypeResolution,
} from '@engine/semantics/inference/type-resolution.pipeline'
import { ASTNodeType, type TypeNode } from '@engine/syntax/nodes'
import { IRRelationshipType } from '@engine/generator/ir/models'

describe('TypeResolutionPipeline', () => {
  let pipeline: TypeResolutionPipeline
  let strategy1: ITypeResolutionStrategy
  let strategy2: ITypeResolutionStrategy

  beforeEach(() => {
    pipeline = new TypeResolutionPipeline()
    strategy1 = {
      resolve: vi.fn(),
      isPrimitive: vi.fn().mockReturnValue(false),
    }
    strategy2 = {
      resolve: vi.fn(),
      isPrimitive: vi.fn().mockReturnValue(false),
    }
  })

  it('should resolve using the first strategy that returns a result', () => {
    const node: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'Test',
      raw: 'Test',
      arguments: [],
      line: 0,
      column: 0,
    }
    const resolution: TypeResolution = {
      targetName: 'Resolved',
      multiplicity: '1',
      relationshipType: IRRelationshipType.ASSOCIATION,
      isIgnored: false,
      label: undefined,
    }

    ;(strategy1.resolve as Mock).mockReturnValue(null)
    ;(strategy2.resolve as Mock).mockReturnValue(resolution)

    pipeline.add(strategy1)
    pipeline.add(strategy2)

    const result = pipeline.resolve(node)
    expect(result).toBe(resolution)
    expect(strategy1.resolve).toHaveBeenCalledWith(node)
    expect(strategy2.resolve).toHaveBeenCalledWith(node)
  })

  it('should return null if no strategy resolves', () => {
    const node: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'Test',
      raw: 'Test',
      arguments: [],
      line: 0,
      column: 0,
    }

    ;(strategy1.resolve as Mock).mockReturnValue(null)
    ;(strategy2.resolve as Mock).mockReturnValue(null)

    pipeline.add(strategy1)
    pipeline.add(strategy2)

    expect(pipeline.resolve(node)).toBeNull()
  })

  it('should identify primitive if ANY strategy says it is primitive', () => {
    ;(strategy1.isPrimitive as Mock).mockReturnValue(false)
    ;(strategy2.isPrimitive as Mock).mockReturnValue(true)

    pipeline.add(strategy1)
    pipeline.add(strategy2)

    expect(pipeline.isPrimitive('anything')).toBe(true)
  })
})
