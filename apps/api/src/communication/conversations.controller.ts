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
import { ConversationsService } from './conversations.service';
import {
  CommunicationListQueryDto,
  CreateConversationDto,
  CreateMessageDto,
  MessageListQueryDto,
} from './dto/communication.dto';

@Controller('communication')
@RequirePermissions(PERMISSION_KEYS.communicationRead)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get('people')
  people(@Query() query: CommunicationListQueryDto) {
    return this.conversations.listPeople(query);
  }

  @Get('conversations')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommunicationListQueryDto,
  ) {
    return this.conversations.list(user, query);
  }

  @Post('conversations')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateConversationDto,
    @Req() request: Request,
  ) {
    return this.conversations.create(user, input, request.ip);
  }

  @Get('conversations/:id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.conversations.get(user, id);
  }

  @Get('conversations/:id/messages')
  messages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: MessageListQueryDto,
  ) {
    return this.conversations.listMessages(user, id, query);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateMessageDto,
  ) {
    return this.conversations.sendMessage(user, id, input);
  }

  @Post('conversations/:id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.conversations.markRead(user, id);
  }

  @Patch('messages/:id')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  updateMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateMessageDto,
  ) {
    return this.conversations.updateMessage(user, id, input);
  }

  @Delete('messages/:id')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  removeMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.conversations.removeMessage(user, id);
  }
}
