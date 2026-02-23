import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfigStore } from '@engine/semantics/session/config-store'
import type { PluginManager } from '@engine/plugins/plugin-manager'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { LanguagePlugin } from '@engine/plugins/language-plugin'
import { IREntityType, type IREntity } from '@engine/generator/ir/models'

describe('ConfigStore', () => {
  let store: ConfigStore
  let pluginManager: PluginManager
  let symbolTable: SymbolTable

  beforeEach(() => {
    pluginManager = {
      supports: vi.fn().mockImplementation((name) => name === 'ts' || name === 'java'),
      activate: vi.fn(),
      getActive: vi.fn().mockReturnValue(null), // Default null
      register: vi.fn(),
    } as unknown as PluginManager

    symbolTable = {
      register: vi.fn(),
      registerNamespace: vi.fn(),
    } as unknown as SymbolTable

    store = new ConfigStore(pluginManager, symbolTable)
  })

  it('should store and retrieve config options', () => {
    const config = { language: 'java', randomOption: true }
    store.merge(config)

    expect(store.get()).toEqual(config)
  })

  it('should merge new options without overriding existing ones (shallow merge)', () => {
    store.merge({ key1: 'value1' })
    store.merge({ key2: 'value2' })

    expect(store.get()).toEqual({ key1: 'value1', key2: 'value2' })
  })

  it('should activate language plugin if specified', () => {
    store.merge({ language: 'ts' })

    expect(pluginManager.activate).toHaveBeenCalledWith('ts')
  })

  it('should load standard library from plugin upon activation', () => {
    const mockEntities: IREntity[] = [
      { id: 'String', type: IREntityType.CLASS, attributes: [], methods: [] },
    ]
    const mockPlugin = {
      name: 'ts',
      getStandardLibrary: vi.fn().mockReturnValue(mockEntities),
      resolveType: vi.fn(),
      mapPrimitive: vi.fn(),
    } as unknown as LanguagePlugin

    // Override getActive for this test
    // Use type assertion to access the mock property directly
    const getActive = pluginManager.getActive as unknown as ReturnType<typeof vi.fn>
    getActive.mockReturnValue(mockPlugin)

    store.merge({ language: 'ts' })

    expect(pluginManager.activate).toHaveBeenCalledWith('ts') // Verify activation
    expect(mockPlugin.getStandardLibrary).toHaveBeenCalled() // Verify plugin usage
    expect(symbolTable.register).toHaveBeenCalledWith(mockEntities[0])

    // Initializing hiddenEntities if not present and pushing
    expect(store.get().hiddenEntities).toBeDefined()
    expect(store.get().hiddenEntities as string[]).toContain('String')
  })

  it('should handle namespace registration for standard library entities', () => {
    const mockEntities: IREntity[] = [
      {
        id: 'java.lang.String',
        type: IREntityType.CLASS,
        namespace: 'java.lang',
        attributes: [],
        methods: [],
      },
    ]
    const mockPlugin = {
      name: 'java',
      getStandardLibrary: vi.fn().mockReturnValue(mockEntities),
      resolveType: vi.fn(),
      mapPrimitive: vi.fn(),
    } as unknown as LanguagePlugin

    // Override getActive for this test
    const getActive = pluginManager.getActive as unknown as ReturnType<typeof vi.fn>
    getActive.mockReturnValue(mockPlugin)

    store.merge({ language: 'java' })

    expect(symbolTable.registerNamespace).toHaveBeenCalledWith('java.lang')
  })
})
