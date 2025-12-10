import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ description: 'Online status of the user' })
  @IsBoolean()
  isOnline: boolean;
}
