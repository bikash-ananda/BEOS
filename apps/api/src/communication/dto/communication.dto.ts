import {
  AnnouncementTarget,
  ConversationType,
  ReactionKind,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ListQueryDto } from '../../common/dto/list-query.dto';

export class CreateDiscussionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body: string;
}

export class UpdateDiscussionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body?: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5_000)
  body: string;
}

export class ReactionDto {
  @IsEnum(ReactionKind)
  kind: ReactionKind;
}

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  memberIds?: string[];
}

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body: string;
}

export class MessageListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body: string;

  @IsEnum(AnnouncementTarget)
  target: AnnouncementTarget;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  userIds?: string[];
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  body?: string;
}

export class CommunicationListQueryDto extends ListQueryDto {}
