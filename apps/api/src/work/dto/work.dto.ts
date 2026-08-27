import {
  MeetingNoteKind,
  MeetingRsvp,
  MeetingStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
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

export class WorkListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateMeetingDto {
  @IsString() @MinLength(3) @MaxLength(160) title: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  participantIds: string[];
}

export class UpdateMeetingDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsEnum(MeetingStatus) status?: MeetingStatus;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  participantIds?: string[];
}

export class RsvpDto {
  @IsEnum(MeetingRsvp) rsvp: MeetingRsvp;
}

export class CreateAgendaItemDto {
  @IsString() @MinLength(1) @MaxLength(240) title: string;
  @IsOptional() @IsString() @MaxLength(5000) details?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  position?: number;
}

export class CreateMeetingNoteDto {
  @IsEnum(MeetingNoteKind) kind: MeetingNoteKind;
  @IsString() @MinLength(1) @MaxLength(10000) body: string;
  @IsOptional() @IsString() agendaItemId?: string;
}

export class CreateDecisionDto {
  @IsString() @MinLength(1) @MaxLength(5000) body: string;
  @IsOptional() @IsString() agendaItemId?: string;
}

export class CreateTaskDto {
  @IsString() @MinLength(3) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsString() meetingId?: string;
  @IsOptional() @IsString() agendaItemId?: string;
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  assigneeIds: string[];
}

export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  assigneeIds?: string[];
}

export class CreateTaskCommentDto {
  @IsString() @MinLength(1) @MaxLength(5000) body: string;
}

export class LinkFileDto {
  @IsString() fileId: string;
}
