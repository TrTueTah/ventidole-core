import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { AllowedMimeType } from '@shared/enum/file.enum';
import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { fileResponses } from './response/index.response';
import { UploadFileRequest } from './request/upload-file.request';
import { UploadFileResponse } from './response/upload-file.response';
import { GetFileUrlResponse } from './response/get-file-url.response';
import { GetFileUrlRequest } from './request/get-file-url.request';
import { GetSignedUrlResponse } from './response/get-signed-url.response';
import { GetSignedUrlRequest } from './request/get-signed-url.request';

@ApiBearerAuth()
@ApiTags('File')
@Controller({ path: 'file', version: '1' })
@ApiExtraModelsCustom(...fileResponses)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileRequest })
  @ApiResponseCustom(UploadFileResponse)
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: new RegExp(Object.values(AllowedMimeType).join('|')),
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: any,
    @Body('folder') folder: string,
    @Body('customFileName') customFileName?: string,
  ) {
    const result = this.fileService.uploadFile({
      file: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder,
      customFileName,
    });

    return result;
  }

  @Post('upload-multiple')
  @UseInterceptors(FileInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiResponseCustom(UploadFileResponse)
  uploadMultipleFiles(
    @UploadedFile() files: any[],
    @Body('folder') folder: string,
  ) {
    const filesData = files.map((file) => ({
      file: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    }));

    return this.fileService.uploadMultipleFiles(filesData, folder);
  }

  @Delete('delete')
  @ApiResponseCustom()
  deleteFile(@Query('filePath') filePath: string) {
    return this.fileService.deleteFile({ filePath });
  }

  @Get('url')
  @ApiResponseCustom(GetFileUrlResponse)
  getFileUrl(@Query() query: GetFileUrlRequest) {
    return this.fileService.getFileUrl(query);
  }

  @Get('signed-url')
  @ApiResponseCustom(GetSignedUrlResponse)
  getSignedUrl(@Query() query: GetSignedUrlRequest) {
    return this.fileService.getSignedUrl(query);
  }

  @Get('exists')
  @ApiResponseCustom()
  fileExists(
    @Query('filePath') filePath: string,
  ) {
    return this.fileService.fileExists(filePath);
  }

  @Get('metadata')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File metadata retrieved successfully',
  })
  async getFileMetadata(@Query('filePath') filePath: string): Promise<any> {
    return this.fileService.getFileMetadata(filePath);
  }

  @Get('list')
  @ApiResponseCustom()
  async listFiles(@Query('folder') folder: string) {
    return this.fileService.listFiles(folder);
  }

  @Delete('folder')
  @ApiResponseCustom()
  deleteFolder(@Query('folder') folder: string) {
    return this.fileService.deleteFolder(folder);
  }
}
