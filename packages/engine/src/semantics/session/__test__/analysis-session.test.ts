import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import type { ConfigStore } from '@engine/semantics/session/config-store'
import type { PluginManager } from '@engine/plugins/plugin-manager'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'

describe('AnalysisSession', () => {
  let session: AnalysisSession
  let symbolTable: SymbolTable
  let constraintRegistry: ConstraintRegistry
  let configStore: ConfigStore
  let pluginManager: PluginManager
  let context: ISemanticContext

  beforeEach(() => {
    symbolTable = {
      getAllEntities: vi.fn(),
      getNamespace: vi.fn(),
      get: vi.fn(),
      register: vi.fn(),
    } as unknown as SymbolTable
    constraintRegistry = {
      getAll: vi.fn(),
      add: vi.fn(),
    } as unknown as ConstraintRegistry
    configStore = {
      get: vi.fn(),
      merge: vi.fn(),
    } as unknown as ConfigStore
    pluginManager = {
      getActive: vi.fn(),
    } as unknown as PluginManager
    context = {
      scope: [],
    } as unknown as ISemanticContext

    session = new AnalysisSession(
      symbolTable,
      constraintRegistry,
      configStore,
      pluginManager,
      context,
    )
  })

  it('should initialize correctly', () => {
    expect(session.symbolTable).toBe(symbolTable)
    expect(session.constraintRegistry).toBe(constraintRegistry)
    expect(session.configStore).toBe(configStore)
    expect(session.pluginManager).toBe(pluginManager)
    expect(session.context).toBe(context)
    expect(session.relationships).toEqual([])
  })

  it('should generate IR Diagram correctly', () => {
    const entities = [{ id: 'Entity1' }]
    const constraints = [{ kind: 'xor' }]
    const config = { direction: 'LR' }

    symbolTable.getAllEntities = vi
      .fn()
      .mockReturnValue(entities as unknown as import('../../../generator/ir/models').IREntity[])
    constraintRegistry.getAll = vi
      .fn()
      .mockReturnValue(
        constraints as unknown as import('../../../generator/ir/models').IRConstraint[],
      )
    configStore.get = vi.fn().mockReturnValue(config)

    const diagram = session.toIRDiagram()

    expect(diagram.entities).toBe(entities)
    expect(diagram.relationships).toBe(session.relationships)
    expect(diagram.constraints).toBe(constraints)
    expect(diagram.config).toBe(config)
  })
})
