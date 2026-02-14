import type { IREntity } from '../generator/ir/models'
import { IREntityType } from '../generator/ir/models'

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

    // 3. Global search by suffix (Global Scout)
    // Helps resolving things like 'Target' when 'pkg1.Target' and 'pkg2.Target' might exist.
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

    // 4. Fallback: Contextualize in current namespace or return as is
    const fqn = currentNamespace ? `${currentNamespace}.${name}` : name
    return { fqn, isAmbiguous: false }
  }

  /**
   * Helper to resolve or register an implicit entity if not found.
   */
  public resolveOrRegisterImplicit(
    name: string,
    namespace: string,
    modifiers?: { isAbstract?: boolean; isStatic?: boolean; isActive?: boolean },
  ): FQNResolution {
    const resolution = this.resolveFQN(name, namespace)
    const existing = this.get(resolution.fqn)

    if (!existing) {
      this.register({
        id: resolution.fqn,
        name: name.includes('.') ? name.split('.').pop()! : name,
        type: IREntityType.CLASS, // Default to class, will be refined if definition is found
        members: [],
        isImplicit: true,
        isAbstract: modifiers?.isAbstract || false,
        isStatic: modifiers?.isStatic || false,
        isActive: modifiers?.isActive || false,
        namespace: resolution.fqn.includes('.')
          ? resolution.fqn.split('.').slice(0, -1).join('.')
          : '',
      })
    }

    return resolution
  }
}
