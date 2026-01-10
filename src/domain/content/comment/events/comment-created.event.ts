import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Comment Created Event
 *
 * Emitted when a new comment is created.
 *
 * Side effects (handled in application layer):
 * - Send notification to post author
 * - Send notification to parent comment author (if reply)
 * - Update post's comment count
 * - Track analytics event
 */
export class CommentCreatedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly authorId: string,
    public readonly postId: string,
    public readonly parentCommentId: string | null,
  ) {
    super(commentId);
  }
}
