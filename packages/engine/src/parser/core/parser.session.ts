/**
 * ParserSession: Almacena el estado volátil del parser que debe persistir
 * entre reglas dentro de una misma sentencia, pero que debe limpiarse si
 * el parser falla o completa una sentencia exitosamente (ej. documentación pendiente).
 */
export class ParserSession {
  private pendingDocs: string | undefined

  /**
   * Almacena documentación JSDoc/DocComment detectada.
   */
  public setPendingDocs(docs: string): void {
    this.pendingDocs = docs
  }

  /**
   * Consume la documentación pendiente, limpiándola del estado.
   */
  public consumePendingDocs(): string | undefined {
    const docs = this.pendingDocs
    this.pendingDocs = undefined
    return docs
  }

  /**
   * Limpia todo el estado volátil de la sesión.
   */
  public clear(): void {
    this.pendingDocs = undefined
  }
}
