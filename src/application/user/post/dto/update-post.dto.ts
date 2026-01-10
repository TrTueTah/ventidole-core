import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

/**
 * Update Post DTO
 *
 * Request DTO for updating a post.
 */
export class UpdatePostDto {
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  mediaUrls?: string[];
}
