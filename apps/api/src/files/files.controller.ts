import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { createReadStream } from 'node:fs';
import type { AuthenticatedUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../rbac/permissions';
import { FileListQueryDto, UploadWorkspaceFileDto } from './dto/files.dto';
import { FilesService, UploadedWorkspaceFile } from './files.service';

@Controller('workspace/files')
@RequirePermissions(PERMISSION_KEYS.filesRead)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FileListQueryDto,
  ) {
    return this.files.list(user, query);
  }

  @Post()
  @RequirePermissions(PERMISSION_KEYS.filesUpload)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: UploadedWorkspaceFile | undefined,
    @Query() input: UploadWorkspaceFileDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.files.upload(file, input, user, request.ip);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.files.download(user, id);
    const fallback = file.originalName.replace(/[^\x20-\x7e]/g, '_');
    response.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.sizeBytes),
      'Content-Disposition': `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(createReadStream(file.path));
  }
}
