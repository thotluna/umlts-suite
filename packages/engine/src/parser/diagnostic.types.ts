export enum DiagnosticSeverity {
  ERROR = 'Error',
  WARNING = 'Warning',
  INFO = 'Info',
}

export interface Diagnostic {
  message: string
  line: number
  column: number
  length?: number
  severity: DiagnosticSeverity
}
