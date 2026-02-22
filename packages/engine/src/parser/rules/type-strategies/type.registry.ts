import type {
  IPrimaryTypeProvider,
  ITypeModifierProvider,
} from '../../core/type-provider.interface'
import { BaseTypeProvider } from './primary/base.provider'
import { XorTypeProvider } from './primary/xor.provider'
import { EnumTypeModifier } from './modifier/enum.modifier'
import { GenericTypeModifier } from './modifier/generic.modifier'

/**
 * TypeRegistry: Gestiona el registro de estrategias para el parseo de tipos.
 */
export class TypeRegistry {
  private readonly primaries: IPrimaryTypeProvider[]
  private readonly modifiers: ITypeModifierProvider[]

  constructor() {
    this.primaries = [new XorTypeProvider(), new BaseTypeProvider()]
    this.modifiers = [new GenericTypeModifier(), new EnumTypeModifier()]
  }

  public getPrimaries(): IPrimaryTypeProvider[] {
    return [...this.primaries]
  }

  public getModifiers(): ITypeModifierProvider[] {
    return [...this.modifiers]
  }

  public registerPrimary(provider: IPrimaryTypeProvider): void {
    this.primaries.unshift(provider)
  }

  public registerModifier(modifier: ITypeModifierProvider): void {
    this.modifiers.push(modifier)
  }
}
