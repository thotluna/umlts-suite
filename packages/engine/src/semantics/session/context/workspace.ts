import type { TenantContext } from './tenant'

/**
 * Representa el entorno global (y multi-archivo en el futuro) para la ejecución en modo SaaS/Serverless.
 * Un Workspace puede contener múltiples AnalysisSession si se analizan sub-grafos o diagramas vinculados.
 */
export class WorkspaceContext {
  private readonly files = new Map<string, string>()

  constructor(
    public readonly id: string,
    public readonly tenant: TenantContext,
  ) {}

  /**
   * Almacena o actualiza la fuente de un archivo en este espacio de trabajo.
   */
  public registerFile(path: string, content: string): void {
    this.files.set(path, content)
  }

  /**
   * Obtiene la fuente actual.
   */
  public getFile(path: string): string | undefined {
    return this.files.get(path)
  }

  /**
   * Lista de archivos actuales procesados.
   */
  public getFiles(): string[] {
    return Array.from(this.files.keys())
  }
}
