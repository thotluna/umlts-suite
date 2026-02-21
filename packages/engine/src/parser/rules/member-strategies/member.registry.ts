import type { IMemberProvider } from './member-strategy.interface'
import { DocCommentProvider } from './providers/doc-comment.provider'
import { CommentProvider } from './providers/comment.provider'
import { ConstraintMemberProvider } from './providers/constraint.provider'
import { NoteMemberProvider } from './providers/note.provider'
import { FeatureMemberProvider } from './providers/feature.provider'

export class MemberRegistry {
  private static readonly providers: IMemberProvider[] = [
    new DocCommentProvider(),
    new CommentProvider(),
    new ConstraintMemberProvider(),
    new NoteMemberProvider(),
    new FeatureMemberProvider(),
  ]

  public static getProviders(): IMemberProvider[] {
    return [...this.providers]
  }

  public static registerProvider(provider: IMemberProvider): void {
    this.providers.unshift(provider)
  }
}
