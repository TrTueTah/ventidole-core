import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

/**
 * Bulk Follow Communities DTO
 *
 * Used for following multiple communities at once.
 * Typical use case: "Choose Community" onboarding screen.
 */
export class BulkFollowCommunitiesDto {
  @ApiProperty({
    description: 'Array of community IDs to follow',
    example: ['cm123abc', 'cm456def', 'cm789ghi'],
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one community ID is required' })
  @IsString({ each: true })
  communityIds: string[];
}
