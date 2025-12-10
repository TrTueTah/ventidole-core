import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFcmTokenDto {
  @ApiProperty({
    description: 'FCM (Firebase Cloud Messaging) device token for push notifications',
    example: 'fGHj8kL9mN0pQ1rS2tU3vW4xY5zA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9',
  })
  @IsNotEmpty()
  @IsString()
  fcmToken: string;
}

export class RegisterFcmTokenResponseDto {
  @ApiProperty({
    description: 'Whether the FCM token was registered successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'FCM token registered successfully',
  })
  message: string;
}
