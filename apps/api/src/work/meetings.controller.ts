import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../rbac/permissions';
import {
  CreateAgendaItemDto,
  CreateDecisionDto,
  CreateMeetingDto,
  CreateMeetingNoteDto,
  LinkFileDto,
  RsvpDto,
  UpdateMeetingDto,
  WorkListQueryDto,
} from './dto/work.dto';
import { MeetingsService } from './meetings.service';

@Controller('work')
@RequirePermissions(PERMISSION_KEYS.meetingsRead)
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get('people') people(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WorkListQueryDto,
  ) {
    return this.meetings.people(user, query);
  }
  @Get('meetings') list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WorkListQueryDto,
  ) {
    return this.meetings.list(user, query);
  }
  @Get('meetings/:id') get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.meetings.get(user, id);
  }

  @Post('meetings')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateMeetingDto,
    @Req() request: Request,
  ) {
    return this.meetings.create(user, input, request.ip);
  }

  @Patch('meetings/:id')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: UpdateMeetingDto,
    @Req() request: Request,
  ) {
    return this.meetings.update(user, id, input, request.ip);
  }

  @Post('meetings/:id/rsvp')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  rsvp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: RsvpDto,
  ) {
    return this.meetings.rsvp(user, id, input);
  }

  @Post('meetings/:id/agenda')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  agenda(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateAgendaItemDto,
  ) {
    return this.meetings.addAgenda(user, id, input);
  }

  @Post('meetings/:id/notes')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  note(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateMeetingNoteDto,
  ) {
    return this.meetings.addNote(user, id, input);
  }

  @Post('meetings/:id/decisions')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  decision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateDecisionDto,
    @Req() request: Request,
  ) {
    return this.meetings.addDecision(user, id, input, request.ip);
  }

  @Post('meetings/:id/attachments')
  @RequirePermissions(PERMISSION_KEYS.meetingsWrite)
  attachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: LinkFileDto,
  ) {
    return this.meetings.linkFile(user, id, input);
  }
}
