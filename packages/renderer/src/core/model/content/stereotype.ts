import { UMLText } from './text'

export class UMLStereotype extends UMLText {
  constructor(id: string, text: string) {
    // Stereotypes are usually smaller and wrapped in guillemets
    const raw = text.startsWith('«') ? text : `«${text}»`
    super(id, raw, 11, 'normal')
  }
}
