import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'User created/updated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user123',
  })
  userId: string;
}
