import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.response';

export class UpdateUserResponse {
  @ApiProperty({
    description: 'Status code',
    example: 200,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'User updated successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Updated user data',
    type: UserDto,
  })
  data: UserDto;
}
