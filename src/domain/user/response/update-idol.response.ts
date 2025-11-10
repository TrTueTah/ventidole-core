import { ApiProperty } from '@nestjs/swagger';
import { IdolDto } from './user.response';

export class UpdateIdolResponse {
  @ApiProperty({
    description: 'Status code',
    example: 200,
    type: Number,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Idol profile updated successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Updated idol profile data',
    type: IdolDto,
  })
  data: IdolDto;
}
