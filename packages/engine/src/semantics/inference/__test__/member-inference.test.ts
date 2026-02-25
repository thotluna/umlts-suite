import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemberInference } from '@engine/semantics/inference/member-inference'
import type { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import { SymbolTable } from '@engine/semantics/symbol-table'
import { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'
import { IREntityType, IRRelationshipType, IRVisibility } from '@engine/generator/ir/models'
import type { IREntity, IRProperty } from '@engine/generator/ir/models'

describe('MemberInference', () => {
  let mockSession: Partial<AnalysisSession>
  let mockAnalyzer: Partial<RelationshipAnalyzer>
  let symbolTable: SymbolTable
  let inference: MemberInference

  beforeEach(() => {
    symbolTable = new SymbolTable()
    mockSession = {
      symbolTable,
      typeResolver: new TypeResolutionPipeline(),
    }
    mockAnalyzer = {
      addResolvedRelationship: vi.fn(),
      resolveOrRegisterImplicit: vi.fn().mockReturnValue('ImplicitTarget'),
    }

    inference = new MemberInference(
      mockSession as AnalysisSession,
      mockAnalyzer as RelationshipAnalyzer,
    )
  })

  it('should infer relationship from property type', () => {
    const entity: IREntity = {
      id: 'User',
      name: 'User',
      isImplicit: false,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
      type: IREntityType.CLASS,
      properties: [
        {
          name: 'account',
          type: 'Account',
          visibility: IRVisibility.PRIVATE,
          aggregation: 'none',
          isStatic: false,
          isReadOnly: false,
          isLeaf: false,
          isOrdered: false,
          isUnique: false,
        } as unknown as IRProperty,
      ],
      operations: [],
    }
    symbolTable.register(entity)

    inference.run()

    expect(mockAnalyzer.resolveOrRegisterImplicit).toHaveBeenCalledWith(
      'Account',
      '',
      expect.anything(),
      undefined,
      undefined,
      expect.anything(),
      undefined,
      undefined,
    )
    expect(mockAnalyzer.addResolvedRelationship).toHaveBeenCalled()
  })

  it('should NOT infer relationship for UML primitive types', () => {
    const entity: IREntity = {
      id: 'User',
      name: 'User',
      isImplicit: false,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
      type: IREntityType.CLASS,
      properties: [
        {
          name: 'age',
          type: 'Integer',
          visibility: IRVisibility.PRIVATE,
          aggregation: 'none',
        } as unknown as IRProperty,
      ],
      operations: [],
    }
    symbolTable.register(entity)

    inference.run()

    expect(mockAnalyzer.addResolvedRelationship).not.toHaveBeenCalled()
  })

  it('should infer relationship from generic type base name', () => {
    const entity: IREntity = {
      id: 'User',
      name: 'User',
      isImplicit: false,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
      type: IREntityType.CLASS,
      properties: [
        {
          name: 'roles',
          type: 'Array<Role>',
          visibility: IRVisibility.PRIVATE,
          aggregation: 'none',
        } as unknown as IRProperty,
      ],
      operations: [],
    }
    symbolTable.register(entity)

    inference.run()

    expect(mockAnalyzer.addResolvedRelationship).toHaveBeenCalledWith(
      'User',
      'ImplicitTarget',
      IRRelationshipType.ASSOCIATION,
      expect.objectContaining({
        label: 'roles',
      }),
    )
    // It should have resolved 'Array' as the base name
    expect(mockAnalyzer.resolveOrRegisterImplicit).toHaveBeenCalledWith(
      'Array',
      '',
      expect.anything(),
      undefined,
      undefined,
      expect.anything(),
      undefined,
      undefined,
    )
  })

  it('should fallback to implicit resolution for unknown types', () => {
    const entity: IREntity = {
      id: 'Order',
      name: 'Order',
      isImplicit: false,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
      type: IREntityType.CLASS,
      properties: [
        {
          name: 'customer',
          type: 'Customer',
          visibility: IRVisibility.PRIVATE,
          aggregation: 'none',
        } as unknown as IRProperty,
      ],
      operations: [],
    }
    symbolTable.register(entity)

    inference.run()

    expect(mockAnalyzer.resolveOrRegisterImplicit).toHaveBeenCalledWith(
      'Customer',
      '',
      expect.anything(),
      undefined,
      undefined,
      expect.anything(),
      undefined,
      undefined,
    )
  })
})
