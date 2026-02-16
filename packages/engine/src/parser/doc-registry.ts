/**
 * DocRegistry: Gestiona el estado volátil de la documentación pendiente (JSDoc/DocComments).
 */
export class DocRegistry {
  private pendingDocs: string | undefined

  public setPendingDocs(docs: string): void {
    this.pendingDocs = docs
  }

  public consumePendingDocs(): string | undefined {
    const docs = this.pendingDocs
    this.pendingDocs = undefined
    return docs
  }
}
