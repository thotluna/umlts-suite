import { describe, it, expect } from 'vitest'
import { SymbolTable } from '../symbol-table'
import { IREntityType, type IREntity } from '../../generator/ir/models'

describe('SymbolTable', () => {
  it('should register and retrieve entities', () => {
    const table = new SymbolTable()
    const entity: IREntity = {
      id: 'pkg.A',
      name: 'A',
      type: IREntityType.CLASS,
      isImplicit: false,
      isAbstract: false,
      isStatic: false,
      isActive: false,
      line: 1,
      column: 1,
      members: [],
    }

    table.register(entity)
    expect(table.get('pkg.A')).toBe(entity)
    expect(table.has('pkg.A')).toBe(true)
    expect(table.getAllEntities()).toContain(entity)
  })

  it('should handle implicit vs explicit registration', () => {
    const table = new SymbolTable()
    const base: Partial<IREntity> = {
      name: 'A',
      type: IREntityType.CLASS,
      isAbstract: false,
      isStatic: false,
      isActive: false,
      line: 1,
      column: 1,
      members: [],
    }

    const implicit: IREntity = { ...base, id: 'A', isImplicit: true } as IREntity
    const explicit: IREntity = { ...base, id: 'A', isImplicit: false } as IREntity

    table.register(implicit)
    expect(table.get('A')).toBe(implicit)

    table.register(explicit)
    expect(table.get('A')).toBe(explicit)

    table.register(implicit)
    expect(table.get('A')).toBe(explicit)
  })

  describe('resolveFQN', () => {
    it('should resolve absolute FQN', () => {
      const table = new SymbolTable()
      const entity: IREntity = {
        id: 'pkg.A',
        name: 'A',
        type: IREntityType.CLASS,
        isImplicit: false,
        isAbstract: false,
        isStatic: false,
        isActive: false,
        line: 1,
        column: 1,
        members: [],
      }
      table.register(entity)

      expect(table.resolveFQN('pkg.A').fqn).toBe('pkg.A')
    })

    it('should resolve hierarchical names', () => {
      const table = new SymbolTable()
      const entity: IREntity = {
        id: 'com.app.User',
        name: 'User',
        type: IREntityType.CLASS,
        isImplicit: false,
        isAbstract: false,
        isStatic: false,
        isActive: false,
        line: 1,
        column: 1,
        members: [],
      }
      table.register(entity)

      expect(table.resolveFQN('User', 'com.app').fqn).toBe('com.app.User')
      expect(table.resolveFQN('User', 'com.app.sub').fqn).toBe('com.app.User')
      // With the new Global Scout, if com.User doesn't exist but com.app.User does, it resolves to the existing one
      expect(table.resolveFQN('User', 'com').fqn).toBe('com.app.User')
    })

    it('should resolve deep global matches (Global Scout)', () => {
      const table = new SymbolTable()
      const entity: IREntity = {
        id: 'semantics.analyzers.EntityAnalyzer',
        name: 'EntityAnalyzer',
        type: IREntityType.CLASS,
        isImplicit: false,
        isAbstract: false,
        isStatic: false,
        isActive: false,
        line: 1,
        column: 1,
        members: [],
      }
      table.register(entity)

      // Should find it even if we are at a different namespace level
      expect(table.resolveFQN('EntityAnalyzer', 'semantics').fqn).toBe(
        'semantics.analyzers.EntityAnalyzer',
      )
    })

    it('should detect ambiguity when multiple matches exist', () => {
      const table = new SymbolTable()
      const e1 = { id: 'pkg1.A', name: 'A', isImplicit: false } as IREntity
      const e2 = { id: 'pkg2.sub.A', name: 'A', isImplicit: false } as IREntity

      table.register(e1)
      table.register(e2)

      const result = table.resolveFQN('A')
      expect(result.isAmbiguous).toBe(true)
      expect(result.candidates).toContain('pkg1.A')
      expect(result.candidates).toContain('pkg2.sub.A')
    })

    it('should fallback to contextualized name if not found', () => {
      const table = new SymbolTable()
      expect(table.resolveFQN('NewClass', 'my.pkg').fqn).toBe('my.pkg.NewClass')
      expect(table.resolveFQN('NewClass').fqn).toBe('NewClass')
    })
  })
})
