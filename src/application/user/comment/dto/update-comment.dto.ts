import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Update Comment DTO
 *
 * Request DTO for updating a comment.
 */
export class UpdateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
