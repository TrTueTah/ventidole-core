import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ManageMembersDto {
  @ApiProperty({
    description: 'Array of user IDs to add/remove',
    example: ['user_1', 'user_2'],
  })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  memberIds: string[];
}
