import { UMLText } from './text'

export class UMLStereotype extends UMLText {
  public values?: Record<string, string | number | boolean>

  constructor(id: string, text: string, values?: Record<string, string | number | boolean>) {
    // Stereotypes are usually smaller and wrapped in guillemets
    const raw = text.startsWith('«') ? text : `«${text}»`
    super(id, raw, 11, 'normal')
    this.values = values
  }

  public getLabel(): string {
    return this.text
  }

  public getFullText(): string {
    if (!this.values || Object.keys(this.values).length === 0) {
      return this.text
    }
    const tags = Object.entries(this.values)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
    return `${this.text} {${tags}}`
  }
}
