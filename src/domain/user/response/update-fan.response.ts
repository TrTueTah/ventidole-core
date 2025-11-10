import { ApiProperty } from '@nestjs/swagger';
import { FanDto } from './user.response';

export class UpdateFanResponse {
  @ApiProperty({
    description: 'Status code',
    example: 200,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Fan profile updated successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Updated fan profile data',
    type: FanDto,
  })
  data: FanDto;
}
