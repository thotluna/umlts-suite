import { UMLMetaclass } from '@engine/core/metamodel'

/**
 * Define un estereotipo según el estándar UML.
 */
export interface StereotypeDefinition {
  name: string
  extends: UMLMetaclass[] // Metaclases que este estereotipo puede extender
  properties?: Record<string, 'String' | 'Integer' | 'Boolean' | 'Float'> // Tagged Values
}

/**
 * Un perfil es un conjunto de estereotipos.
 */
export interface ProfileDefinition {
  name: string
  stereotypes: StereotypeDefinition[]
}

/**
 * Registro central de perfiles y estereotipos.
 */
export class ProfileRegistry {
  private profiles: Map<string, ProfileDefinition> = new Map()
  private stereotypeIndex: Map<string, { stereotype: StereotypeDefinition; profile: string }> =
    new Map()

  constructor() {
    // Inyectar perfiles estándar por defecto
    this.registerBuiltInProfiles()
  }

  public registerProfile(profile: ProfileDefinition): void {
    this.profiles.set(profile.name, profile)
    for (const st of profile.stereotypes) {
      // indexamos por nombre para búsqueda rápida (@entity)
      this.stereotypeIndex.set(st.name.toLowerCase(), { stereotype: st, profile: profile.name })
    }
  }

  public getStereotype(name: string): StereotypeDefinition | undefined {
    return this.stereotypeIndex.get(name.toLowerCase())?.stereotype
  }

  private registerBuiltInProfiles(): void {
    this.registerProfile({
      name: 'UMLStandard',
      stereotypes: [
        { name: 'entity', extends: [UMLMetaclass.CLASS] },
        { name: 'control', extends: [UMLMetaclass.CLASS] },
        { name: 'boundary', extends: [UMLMetaclass.CLASS] },
        { name: 'service', extends: [UMLMetaclass.COMPONENT, UMLMetaclass.CLASS] },
        { name: 'utility', extends: [UMLMetaclass.CLASS] },
        { name: 'process', extends: [UMLMetaclass.COMPONENT] },
        { name: 'derive', extends: [UMLMetaclass.ABSTRACTION] },
        { name: 'refine', extends: [UMLMetaclass.ABSTRACTION] },
        { name: 'trace', extends: [UMLMetaclass.ABSTRACTION] },
      ],
    })
  }
}
