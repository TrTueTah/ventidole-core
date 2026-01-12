import { ApiProperty } from '@nestjs/swagger';

/**
 * Bulk Follow Result DTO
 *
 * Response for bulk follow operation.
 * Includes success/failure counts and error details.
 */
export class BulkFollowResultDto {
  @ApiProperty({
    description: 'Number of communities successfully followed',
    example: 3,
  })
  succeeded: number;

  @ApiProperty({
    description: 'Number of communities that failed to follow',
    example: 1,
  })
  failed: number;

  @ApiProperty({
    description: 'Array of errors for failed operations',
    example: [
      {
        communityId: 'cm123abc',
        error: 'Community not found',
      },
    ],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        communityId: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  errors: Array<{ communityId: string; error: string }>;
}
