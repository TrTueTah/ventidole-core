import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetFileUrlRequest {
  @ApiProperty({
    description: 'Path to the file in storage',
    example: 'posts/my-file-uuid.jpg',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}