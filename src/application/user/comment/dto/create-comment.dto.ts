import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * Create Comment DTO
 *
 * Request DTO for creating a new comment.
 */
export class CreateCommentDto {
  @IsString()
  postId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
