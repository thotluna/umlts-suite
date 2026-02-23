export interface TenantContext {
  /**
   * Identificador único del tenant (cliente/organización).
   */
  id: string

  /**
   * Roles o permisos del tenant (opcional, para futuras autorizaciones de extensiones).
   */
  roles?: string[]

  /**
   * Opciones específicas de la organización (ej. max_nodes permitidos, validaciones estrictas, etc).
   */
  limits?: {
    maxEntities?: number
    maxRelationships?: number
  }
}
