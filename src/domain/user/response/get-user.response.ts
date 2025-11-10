import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.response';

export class GetUserResponse {
  @ApiProperty({
    description: 'Status code',
    example: 200,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'User retrieved successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'User data',
    type: UserDto,
  })
  data: UserDto;
}
