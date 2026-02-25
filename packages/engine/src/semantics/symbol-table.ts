import type { IREntity } from '@engine/generator/ir/models'
import { IREntityType } from '@engine/generator/ir/models'
import type { Modifiers } from '@engine/syntax/nodes'

export interface FQNResolution {
  fqn: string
  isAmbiguous: boolean
  candidates?: string[]
}

/**
 * Symbol Table to manage entities and their semantic resolution.
 */
export class SymbolTable {
  private readonly entities = new Map<string, IREntity>()
  private readonly namespaces = new Set<string>()
  private readonly primitives = new Set<string>()

  /**
   * Registers a new primitive type.
   */
  public registerPrimitive(name: string): void {
    this.primitives.add(name)
  }

  /**
   * Checks if a type name is a primitive.
   */
  public isPrimitive(name: string): boolean {
    return this.primitives.has(name)
  }

  /**
   * Registers a namespace (Package) to prevent collisions with entities.
   */
  public registerNamespace(fqn: string): void {
    this.namespaces.add(fqn)
  }

  /**
   * Checks if a name is already used as a namespace.
   */
  public isNamespace(fqn: string): boolean {
    return this.namespaces.has(fqn)
  }

  /**
   * Registers an entity. If it already exists and is implicit, overwrites it with the explicit one.
   */
  public register(entity: IREntity): void {
    const existing = this.entities.get(entity.id)

    // If explicit already exists, don't overwrite with another explicit or implicit
    if (existing != null && !existing.isImplicit) {
      if (entity.isImplicit) return
      // If both are explicit, we allow re-registration for now, but usually it should be a diagnostic
    }

    // Overwrite implicit with explicit or update implicit
    this.entities.set(entity.id, entity)
  }

  /**
   * Retrieves an entity by its ID (FQN).
   */
  public get(id: string): IREntity | undefined {
    return this.entities.get(id)
  }

  /**
   * Returns all registered entities.
   */
  public getAllEntities(): IREntity[] {
    return Array.from(this.entities.values())
  }

  /**
   * Checks if an entity exists.
   */
  public has(id: string): boolean {
    return this.entities.has(id)
  }

  /**
   * Resolves a simple name to an FQN within a namespace context with upward search.
   */
  public resolveFQN(name: string, currentNamespace?: string): FQNResolution {
    // 0. Check if it's a primitive
    if (this.isPrimitive(name)) {
      return { fqn: name, isAmbiguous: false }
    }

    // 1. Exact resolution attempt (absolute FQN)
    if (this.has(name)) {
      return { fqn: name, isAmbiguous: false }
    }

    // 2. Upward search in current namespace (if exists)
    if (currentNamespace) {
      const parts = currentNamespace.split('.')
      for (let i = parts.length; i >= 0; i--) {
        const prefix = parts.slice(0, i).join('.')
        const candidate = prefix ? `${prefix}.${name}` : name
        if (this.has(candidate)) {
          return { fqn: candidate, isAmbiguous: false }
        }
      }
    }

    // 4. Global search by suffix (Global Scout)
    const suffix = name.includes('.') ? name : '.' + name
    const matches = this.getAllEntities().filter(
      (e) => !e.isImplicit && (e.id.endsWith(suffix) || e.id === name),
    )

    if (matches.length === 1) {
      return { fqn: matches[0].id, isAmbiguous: false }
    }

    if (matches.length > 1) {
      return {
        fqn: matches[0].id, // Pick first but flag as ambiguous
        isAmbiguous: true,
        candidates: matches.map((m) => m.id),
      }
    }

    // 5. Generic resolution attempt
    if (name.includes('<')) {
      const baseName = name.split('<')[0]
      const baseResolution = this.resolveFQN(baseName, currentNamespace)
      const baseEntity = this.get(baseResolution.fqn)

      if (baseEntity && baseEntity.typeParameters && baseEntity.typeParameters.length > 0) {
        return baseResolution
      }
    }

    // 6. Fallback
    const fqn = currentNamespace ? `${currentNamespace}.${name}` : name
    return { fqn, isAmbiguous: false }
  }

  /**
   * Helper to resolve or register an implicit entity if not found.
   */
  public resolveOrRegisterImplicit(
    name: string,
    namespace: string,
    modifiers?: Modifiers,
    expectedType: IREntityType = IREntityType.CLASS,
    literals?: string[],
  ): FQNResolution {
    const resolution = this.resolveFQN(name, namespace)

    // Don't register if it's a primitive
    if (this.isPrimitive(resolution.fqn)) {
      return resolution
    }

    const existing = this.get(resolution.fqn)

    if (!existing) {
      if (this.isNamespace(resolution.fqn)) {
        return resolution
      }

      this.register({
        id: resolution.fqn,
        name: name.includes('.') ? name.split('.').pop()! : name,
        type: expectedType,
        properties: [],
        operations: [],
        literals: literals?.map((l) => ({ name: l })),
        isImplicit: true,
        isAbstract: modifiers?.isAbstract || false,
        isStatic: modifiers?.isStatic || false,
        isActive: modifiers?.isActive || false,
        isLeaf: modifiers?.isLeaf || false,
        isFinal: modifiers?.isFinal || false,
        isRoot: modifiers?.isRoot || false,
        namespace: resolution.fqn.includes('.')
          ? resolution.fqn.split('.').slice(0, -1).join('.')
          : '',
      })
    }

    return resolution
  }
}
