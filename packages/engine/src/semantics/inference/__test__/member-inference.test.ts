import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemberInference } from '../member-inference'
import type { AnalysisSession } from '../../session/analysis-session'
import type { TypeResolutionPipeline } from '../type-resolution.pipeline'
import type { RelationshipAnalyzer } from '../../analyzers/relationship-analyzer'
import { SymbolTable } from '../../symbol-table'
import { IREntityType, IRRelationshipType, IRVisibility } from '../../../generator/ir/models'
import type { IREntity, IRProperty } from '../../../generator/ir/models'

describe('MemberInference', () => {
  let mockSession: Partial<AnalysisSession>
  let mockAnalyzer: Partial<RelationshipAnalyzer>
  let mockPipeline: Partial<TypeResolutionPipeline>
  let symbolTable: SymbolTable
  let inference: MemberInference

  beforeEach(() => {
    symbolTable = new SymbolTable()
    mockSession = { symbolTable }
    mockAnalyzer = {
      addResolvedRelationship: vi.fn(),
      resolveOrRegisterImplicit: vi.fn().mockReturnValue('ImplicitTarget'),
    }
    mockPipeline = {
      resolve: vi.fn().mockReturnValue(null),
      isPrimitive: vi.fn().mockImplementation((name) => ['String', 'Integer'].includes(name)),
    }

    inference = new MemberInference(
      mockSession as AnalysisSession,
      mockAnalyzer as RelationshipAnalyzer,
      mockPipeline as TypeResolutionPipeline,
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

  it('should use pipeline resolution if available', () => {
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

    // Mock pipeline returning a resolved type (e.g. Role with multiplicity *)
    vi.spyOn(mockPipeline, 'resolve').mockReturnValue({
      targetName: 'Role',
      multiplicity: '0..*',
      relationshipType: IRRelationshipType.ASSOCIATION,
      label: 'roles',
      isIgnored: false,
    })

    inference.run()

    expect(mockAnalyzer.addResolvedRelationship).toHaveBeenCalledWith(
      'User',
      'ImplicitTarget',
      IRRelationshipType.ASSOCIATION,
      expect.objectContaining({
        toMultiplicity: '0..*',
        label: 'roles',
      }),
    )
  })

  it('should fallback to implicit resolution if pipeline returns null', () => {
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
    )
  })
})
