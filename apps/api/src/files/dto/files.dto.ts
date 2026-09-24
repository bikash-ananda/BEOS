import { WorkspaceFileScope } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class UploadWorkspaceFileDto {
  @IsEnum(WorkspaceFileScope)
  scope!: WorkspaceFileScope;
}

export class FileListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(WorkspaceFileScope)
  scope?: WorkspaceFileScope;
}
