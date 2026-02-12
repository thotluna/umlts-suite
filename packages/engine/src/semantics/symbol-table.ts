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
    if (!currentNamespace) return name;

    // Si el nombre ya contiene un punto, es un FQN (Fully Qualified Name)
    // Ejemplos: core.DiagramNode, utils.SVGAttr
    // En este caso, lo tratamos como absoluto y verificamos si existe
    if (name.includes('.')) {
      // Si existe exactamente como está, lo devolvemos
      if (this.has(name)) return name;

      // Si no existe, lo devolvemos tal cual para que se cree como implícito
      // con ese FQN exacto (no lo concatenamos con el namespace actual)
      return name;
    }

    // Si el nombre ya es un FQN absoluto que existe, lo devolvemos
    if (this.has(name)) return name;

    const parts = currentNamespace.split('.');

    // Búsqueda ascendente: core.domain.User -> core.User -> User
    for (let i = parts.length; i >= 0; i--) {
      const prefix = parts.slice(0, i).join('.');
      const candidate = prefix ? `${prefix}.${name}` : name;

      if (this.has(candidate)) return candidate;
    }

    // Fallback: si no se encuentra en ninguna parte de la jerarquía, 
    // lo asumimos en el namespace actual (se creará como implícito luego si es necesario)
    return `${currentNamespace}.${name}`;
  }
}
