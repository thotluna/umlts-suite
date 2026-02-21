import type { IPrimaryTypeProvider, ITypeModifierProvider } from './type-strategy.interface'
import { BaseTypeProvider } from './primary/base.provider'
import { XorTypeProvider } from './primary/xor.provider'
import { EnumTypeModifier } from './modifier/enum.modifier'
import { GenericTypeModifier } from './modifier/generic.modifier'

export class TypeRegistry {
  private static readonly primaries: IPrimaryTypeProvider[] = [
    new XorTypeProvider(),
    new BaseTypeProvider(),
  ]

  private static readonly modifiers: ITypeModifierProvider[] = [
    new GenericTypeModifier(),
    new EnumTypeModifier(),
  ]

  public static getPrimaries(): IPrimaryTypeProvider[] {
    return [...this.primaries]
  }

  public static getModifiers(): ITypeModifierProvider[] {
    return [...this.modifiers]
  }

  public static registerPrimary(provider: IPrimaryTypeProvider): void {
    this.primaries.unshift(provider)
  }

  public static registerModifier(modifier: ITypeModifierProvider): void {
    this.modifiers.push(modifier)
  }
}
