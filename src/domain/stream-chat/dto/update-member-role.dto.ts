import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ChannelMemberRole {
  TRUSTED_MEMBER = 'trusted_member',
  DEFAULT_MEMBER = 'default_member',
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'The role to assign to the member',
    enum: ChannelMemberRole,
    example: ChannelMemberRole.TRUSTED_MEMBER,
  })
  @IsEnum(ChannelMemberRole)
  @IsNotEmpty()
  role: ChannelMemberRole;
}
