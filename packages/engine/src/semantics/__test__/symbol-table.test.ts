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

      expect(table.resolveFQN('pkg.A')).toBe('pkg.A')
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

      expect(table.resolveFQN('User', 'com.app')).toBe('com.app.User')
      expect(table.resolveFQN('User', 'com.app.sub')).toBe('com.app.User')
      expect(table.resolveFQN('User', 'com')).toBe('com.User')
    })

    it('should resolve partial FQNs by suffix', () => {
      const table = new SymbolTable()
      const entity: IREntity = {
        id: 'org.core.Rules.EntityRule',
        name: 'EntityRule',
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

      expect(table.resolveFQN('Rules.EntityRule')).toBe('org.core.Rules.EntityRule')
    })

    it('should fallback to contextualized name if not found', () => {
      const table = new SymbolTable()
      expect(table.resolveFQN('NewClass', 'my.pkg')).toBe('my.pkg.NewClass')
      expect(table.resolveFQN('NewClass')).toBe('NewClass')
    })
  })
})
