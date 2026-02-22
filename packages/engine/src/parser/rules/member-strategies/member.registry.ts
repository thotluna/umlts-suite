import type { IMemberProvider } from '../../core/member-provider.interface'
import { DocCommentProvider } from './providers/doc-comment.provider'
import { CommentProvider } from './providers/comment.provider'
import { ConstraintMemberProvider } from './providers/constraint.provider'
import { NoteMemberProvider } from './providers/note.provider'
import { FeatureMemberProvider } from './providers/feature.provider'

/**
 * MemberRegistry: Gestiona el registro de proveedores de estrategias para miembros.
 * Ya no es estático para permitir diferentes configuraciones por instancia de Parser.
 */
export class MemberRegistry {
  private readonly providers: IMemberProvider[]

  constructor(initialProviders?: IMemberProvider[]) {
    this.providers = initialProviders ?? [
      new DocCommentProvider(),
      new CommentProvider(),
      new ConstraintMemberProvider(),
      new NoteMemberProvider(),
      new FeatureMemberProvider(),
    ]
  }

  public getProviders(): IMemberProvider[] {
    return [...this.providers]
  }

  public registerProvider(provider: IMemberProvider): void {
    this.providers.unshift(provider)
  }
}
