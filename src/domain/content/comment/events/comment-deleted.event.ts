import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Comment Deleted Event
 *
 * Emitted when a comment is deleted (soft delete).
 *
 * Side effects (handled in application layer):
 * - Update post's comment count
 * - Track analytics event
 */
export class CommentDeletedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
  ) {
    super(commentId);
  }
}
