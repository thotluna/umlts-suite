import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { PluginTypeResolutionAdapter } from '../plugin-adapter'
import type { PluginManager } from '../../../plugins/plugin-manager'
import type { LanguagePlugin, TypeMapping } from '../../../plugins/language-plugin'
import { ASTNodeType, type TypeNode } from '../../../syntax/nodes'
import { IRRelationshipType } from '../../../generator/ir/models'

describe('PluginTypeResolutionAdapter', () => {
  let adapter: PluginTypeResolutionAdapter
  let pluginManager: PluginManager
  let mockPlugin: LanguagePlugin

  beforeEach(() => {
    mockPlugin = {
      name: 'test',
      resolveType: vi.fn(),
      mapPrimitive: vi.fn(),
      supports: vi.fn().mockReturnValue(true),
      getStandardLibrary: vi.fn().mockReturnValue([]),
    } as unknown as LanguagePlugin

    pluginManager = {
      getActive: vi.fn().mockReturnValue(mockPlugin),
      register: vi.fn(),
      activate: vi.fn(),
      supports: vi.fn(),
    } as unknown as PluginManager

    adapter = new PluginTypeResolutionAdapter(pluginManager)
  })

  it('should resolve using active plugin', () => {
    const node: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'Test',
      raw: 'Test',
      arguments: [],
      line: 0,
      column: 0,
    }
    const mapping: TypeMapping = {
      targetName: 'Mapped',
      multiplicity: '1',
      relationshipType: IRRelationshipType.ASSOCIATION,
      label: undefined,
      isIgnored: false,
    }
    ;(mockPlugin.resolveType as Mock).mockReturnValue(mapping)

    const resolution = adapter.resolve(node)
    expect(resolution).toMatchObject(mapping)
  })

  it('should identify primitive via plugin', () => {
    ;(mockPlugin.mapPrimitive as Mock).mockReturnValue('Boolean')

    expect(adapter.isPrimitive('bool')).toBe(true)
    expect(mockPlugin.mapPrimitive).toHaveBeenCalledWith('bool')
  })

  it('should return null if no active plugin', () => {
    ;(pluginManager.getActive as Mock).mockReturnValue(null)

    const node: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'Test',
      raw: 'Test',
      arguments: [],
      line: 0,
      column: 0,
    }

    expect(adapter.resolve(node)).toBeNull()
    expect(adapter.isPrimitive('bool')).toBe(false)
  })
})
