import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssociationClassResolver } from '@engine/semantics/resolvers/association-class.resolver'
import type { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import {
  IRRelationshipType,
  type IRRelationship,
  type IREntity,
  IREntityType,
} from '@engine/generator/ir/models'
import { ASTNodeType, type AssociationClassNode } from '@engine/syntax/nodes'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'

describe('AssociationClassResolver', () => {
  let mockSession: Partial<AnalysisSession>
  let mockAnalyzer: Partial<RelationshipAnalyzer>
  let resolver: AssociationClassResolver

  beforeEach(() => {
    mockSession = {
      symbolTable: {
        get: vi.fn(),
        register: vi.fn(),
        registerNamespace: vi.fn(),
        resolveFQN: vi.fn((name) => ({ fqn: name })),
      } as unknown as SymbolTable,
      relationships: [] as IRRelationship[],
      constraintRegistry: {
        add: vi.fn(),
      } as unknown as ConstraintRegistry,
    }

    // Explicitly define mock functions to avoid 'any' in expectations
    mockAnalyzer = {
      addResolvedRelationship: vi.fn(),
      resolveOrRegisterImplicit: vi.fn().mockImplementation((name) => name),
      mapRelationshipType: vi.fn(),
      addRelationship: vi.fn(),
    }

    resolver = new AssociationClassResolver(
      mockSession as AnalysisSession,
      mockAnalyzer as RelationshipAnalyzer,
      [],
    )
  })

  it('should resolve a valid association class', () => {
    const node: AssociationClassNode = {
      type: ASTNodeType.ASSOCIATION_CLASS,
      name: 'Enrollment',
      line: 1,
      column: 1,
      participants: [
        { name: 'Student', multiplicity: '1' },
        { name: 'Course', multiplicity: '*' },
      ],
      body: [],
    }

    // Mock getting the Association Class entity itself
    const assocEntity: IREntity = {
      id: 'Enrollment',
      name: 'Enrollment',
      type: IREntityType.CLASS,
      isImplicit: false,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
      properties: [],
      operations: [],
    }

    const symbolTableGet = mockSession.symbolTable!.get as unknown as ReturnType<typeof vi.fn>
    symbolTableGet.mockReturnValue(assocEntity)

    resolver.resolve(node)

    // Verify calls
    expect(mockAnalyzer.resolveOrRegisterImplicit).toHaveBeenCalledWith(
      'Student',
      '',
      expect.anything(),
      1,
      1,
    )
    expect(mockAnalyzer.resolveOrRegisterImplicit).toHaveBeenCalledWith(
      'Course',
      '',
      expect.anything(),
      1,
      1,
    )

    expect(mockAnalyzer.addResolvedRelationship).toHaveBeenCalledWith(
      'Student',
      'Course',
      IRRelationshipType.BIDIRECTIONAL,
      expect.objectContaining({
        associationClassId: 'Enrollment',
        fromMultiplicity: '1',
        toMultiplicity: '*',
      }),
    )
  })

  it('should ignore association class with invalid number of participants', () => {
    const node: AssociationClassNode = {
      type: ASTNodeType.ASSOCIATION_CLASS,
      name: 'Enrollment',
      participants: [{ name: 'Student' }], // Only 1
      body: [],
      line: 1,
      column: 1,
    }

    resolver.resolve(node)

    expect(mockAnalyzer.addResolvedRelationship).not.toHaveBeenCalled()
  })
})
