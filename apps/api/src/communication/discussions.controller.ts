import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../rbac/permissions';
import { DiscussionsService } from './discussions.service';
import {
  CommunicationListQueryDto,
  CreateCommentDto,
  CreateDiscussionDto,
  ReactionDto,
  UpdateDiscussionDto,
} from './dto/communication.dto';

@Controller('communication/discussions')
@RequirePermissions(PERMISSION_KEYS.communicationRead)
export class DiscussionsController {
  constructor(private readonly discussions: DiscussionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CommunicationListQueryDto,
  ) {
    return this.discussions.list(user, query);
  }

  @Post()
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateDiscussionDto,
    @Req() request: Request,
  ) {
    return this.discussions.create(user, input, request.ip);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: UpdateDiscussionDto,
    @Req() request: Request,
  ) {
    return this.discussions.update(user, id, input, request.ip);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.discussions.remove(user, id, request.ip);
  }

  @Get(':id/comments')
  comments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: CommunicationListQueryDto,
  ) {
    return this.discussions.listComments(user, id, query);
  }

  @Post(':id/comments')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateCommentDto,
  ) {
    return this.discussions.createComment(user, id, input);
  }

  @Patch('comments/:id')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  updateComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateCommentDto,
  ) {
    return this.discussions.updateComment(user, id, input);
  }

  @Delete('comments/:id')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  removeComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.discussions.removeComment(user, id);
  }

  @Put(':id/reaction')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  react(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: ReactionDto,
  ) {
    return this.discussions.reactToDiscussion(user, id, input.kind);
  }

  @Delete(':id/reaction')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  clearReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.discussions.clearDiscussionReaction(user, id);
  }

  @Put('comments/:id/reaction')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  reactToComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: ReactionDto,
  ) {
    return this.discussions.reactToComment(user, id, input.kind);
  }

  @Delete('comments/:id/reaction')
  @RequirePermissions(PERMISSION_KEYS.communicationWrite)
  clearCommentReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.discussions.clearCommentReaction(user, id);
  }
}
