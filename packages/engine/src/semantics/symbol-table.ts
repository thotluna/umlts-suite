import type { IREntity, IREntityType } from '../generator/ir/models';

/**
 * Tabla de símbolos para gestionar entidades y su resolución semántica.
 */
export class SymbolTable {
  private entities: Map<string, IREntity> = new Map();

  /**
   * Registra una entidad. Si ya existe y es implícita, la sobreescribe con la explícita.
   */
  public register(entity: IREntity): void {
    const existing = this.entities.get(entity.id);

    if (existing && !existing.isImplicit && !entity.isImplicit) {
      return;
    }

    if (existing && existing.isImplicit && !entity.isImplicit) {
      this.entities.set(entity.id, entity);
      return;
    }

    if (!existing) {
      this.entities.set(entity.id, entity);
    }
  }

  /**
   * Busca una entidad por su ID (FQN).
   */
  public get(id: string): IREntity | undefined {
    return this.entities.get(id);
  }

  /**
   * Retorna todas las entidades registradas.
   */
  public getAllEntities(): IREntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Verifica si una entidad existe.
   */
  public has(id: string): boolean {
    return this.entities.has(id);
  }

  /**
   * Resuelve un nombre simple a un FQN dentro de un contexto de namespace con búsqueda ascendente.
   */
  public resolveFQN(name: string, currentNamespace?: string): string {
    // 1. Intento de resolución exacta (FQN absoluto)
    if (this.has(name)) return name;

    // 2. Búsqueda ascendente en el namespace actual (si existe)
    if (currentNamespace) {
      const parts = currentNamespace.split('.');
      for (let i = parts.length; i >= 0; i--) {
        const prefix = parts.slice(0, i).join('.');
        const candidate = prefix ? `${prefix}.${name}` : name;
        if (this.has(candidate)) return candidate;
      }
    }

    // 3. Resolución global por sufijo (para FQNs parciales como Rules.EntityRule)
    if (name.includes('.')) {
      const candidates = this.getAllEntities().filter(e =>
        !e.isImplicit && (e.id.endsWith('.' + name) || e.id === name)
      );

      // Si hay un único match explícito que termina con este sufijo, lo usamos
      if (candidates.length === 1) {
        return candidates[0].id;
      }
    }

    // 4. Fallback: Contextualizar en el namespace actual o retornar tal cual
    if (!currentNamespace) return name;

    return `${currentNamespace}.${name}`;
  }
}
