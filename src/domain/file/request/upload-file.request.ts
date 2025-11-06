import { ApiProperty } from "@nestjs/swagger";
import { FileFolder } from "@shared/enum/file.enum";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UploadFileRequest {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: any;

  @ApiProperty({
    enum: FileFolder,
    description: 'Folder to upload the file to',
    example: FileFolder.Posts,
  })
  @IsEnum(FileFolder)
  @IsNotEmpty()
  folder: FileFolder;

  @ApiProperty({
    description: 'Custom file name (optional)',
    example: 'my-custom-name',
    type: String,
  })
  @IsString()
  @IsOptional()
  customFileName?: string;
}