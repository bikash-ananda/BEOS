import {
  Body,
  Controller,
  Delete,
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
import { AnnouncementsService } from './announcements.service';
import {
  CommunicationListQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/communication.dto';

@Controller('communication/announcements')
@RequirePermissions(PERMISSION_KEYS.communicationRead)
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommunicationListQueryDto,
  ) {
    return this.announcements.list(user, query);
  }

  @Post()
  @RequirePermissions(PERMISSION_KEYS.announcementsManage)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateAnnouncementDto,
    @Req() request: Request,
  ) {
    return this.announcements.create(user, input, request.ip);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_KEYS.announcementsManage)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: UpdateAnnouncementDto,
    @Req() request: Request,
  ) {
    return this.announcements.update(user, id, input, request.ip);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_KEYS.announcementsManage)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.announcements.remove(user, id, request.ip);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.announcements.markRead(user, id);
  }
}
