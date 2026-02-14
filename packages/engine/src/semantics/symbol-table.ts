import { IREntityType } from '../generator/ir/models'
import type { IREntity } from '../generator/ir/models'
import { FQNBuilder } from './utils/fqn-builder'

export interface ResolutionResult {
  fqn: string
  isAmbiguous?: boolean
  candidates?: string[]
}

/**
 * Tabla de símbolos para gestionar entidades y su resolución semántica.
 */
export class SymbolTable {
  private readonly entities = new Map<string, IREntity>()

  /**
   * Registra una entidad. Si ya existe y es implícita, la sobreescribe con la explícita.
   */
  public register(entity: IREntity): void {
    const existing = this.entities.get(entity.id)

    if (existing != null && !existing.isImplicit && !entity.isImplicit) {
      return
    }

    if (existing != null && existing.isImplicit && !entity.isImplicit) {
      this.entities.set(entity.id, entity)
      return
    }

    if (existing == null) {
      this.entities.set(entity.id, entity)
    }
  }

  /**
   * Busca una entidad por su ID (FQN).
   */
  public get(id: string): IREntity | undefined {
    return this.entities.get(id)
  }

  /**
   * Retorna todas las entidades registradas.
   */
  public getAllEntities(): IREntity[] {
    return Array.from(this.entities.values())
  }

  /**
   * Verifica si una entidad existe.
   */
  public has(id: string): boolean {
    return this.entities.has(id)
  }

  /**
   * Resuelve un nombre simple o cualificado a un FQN dentro de un contexto de namespace.
   */
  public resolveFQN(name: string, currentNamespace?: string): ResolutionResult {
    const trimmedName = name.trim()

    // 1. Intento de resolución exacta (FQN absoluto ya registrado)
    if (this.has(trimmedName)) return { fqn: trimmedName }

    // 2. Búsqueda ascendente en el namespace actual
    if (currentNamespace) {
      const parts = currentNamespace.split('.')
      for (let i = parts.length; i >= 0; i--) {
        const prefix = parts.slice(0, i).join('.')
        const candidate = prefix ? `${prefix}.${trimmedName}` : trimmedName
        if (this.has(candidate)) return { fqn: candidate }
      }
    }

    // 3. Global Scout: Búsqueda profunda en todos los paquetes
    const explicitEntities = this.getAllEntities().filter((e) => !e.isImplicit)
    const matches = explicitEntities.filter(
      (e) => e.name === trimmedName || e.id === trimmedName || e.id.endsWith(`.${trimmedName}`),
    )

    if (matches.length === 1) {
      return { fqn: matches[0].id }
    }

    if (matches.length > 1) {
      return {
        fqn: matches[0].id,
        isAmbiguous: true,
        candidates: matches.map((m) => m.id),
      }
    }

    // 4. Fallback: Contextualizar en el namespace actual
    const fallbackFQN = currentNamespace ? `${currentNamespace}.${trimmedName}` : trimmedName
    return { fqn: fallbackFQN }
  }

  /**
   * Intenta resolver una entidad y, si no existe, la registra como implícita.
   * Devuelve información sobre el resultado.
   */
  public resolveOrRegisterImplicit(
    name: string,
    namespace: string,
    modifiers?: { isAbstract?: boolean; isStatic?: boolean; isActive?: boolean },
  ): { fqn: string; isNew: boolean; isAmbiguous: boolean; candidates?: string[] } {
    const baseName = name.includes('<') ? name.substring(0, name.indexOf('<')) : name
    const result = this.resolveFQN(baseName, namespace)
    const fqn = result.fqn

    const existing = this.get(fqn)
    if (existing == null) {
      const { name: shortName, namespace: entityNamespace } = FQNBuilder.split(fqn)
      const entity = this.buildImplicit(fqn, shortName, entityNamespace, modifiers)
      this.register(entity)
      return { fqn, isNew: true, isAmbiguous: !!result.isAmbiguous, candidates: result.candidates }
    }

    return { fqn, isNew: false, isAmbiguous: !!result.isAmbiguous, candidates: result.candidates }
  }

  private buildImplicit(
    fqn: string,
    name: string,
    namespace: string | undefined,
    modifiers?: { isAbstract?: boolean; isStatic?: boolean; isActive?: boolean },
  ): IREntity {
    return {
      id: fqn,
      name,
      type: IREntityType.CLASS,
      members: [],
      isImplicit: true,
      isAbstract: modifiers?.isAbstract || false,
      isStatic: modifiers?.isStatic || false,
      isActive: modifiers?.isActive || false,
      namespace,
    }
  }
}
