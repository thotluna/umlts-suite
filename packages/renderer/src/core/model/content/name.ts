import { UMLText } from './text'

export class UMLName extends UMLText {
  constructor(id: string, text: string) {
    super(id, text, 14, 'bold')
  }
}
