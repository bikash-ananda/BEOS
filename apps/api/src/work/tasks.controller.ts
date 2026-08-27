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
  CreateTaskCommentDto,
  CreateTaskDto,
  LinkFileDto,
  UpdateTaskDto,
  WorkListQueryDto,
} from './dto/work.dto';
import { TasksService } from './tasks.service';

@Controller('work')
@RequirePermissions(PERMISSION_KEYS.tasksRead)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('summary') summary(@CurrentUser() user: AuthenticatedUser) {
    return this.tasks.summary(user);
  }
  @Get('tasks') list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WorkListQueryDto,
  ) {
    return this.tasks.list(user, query);
  }
  @Get('tasks/:id') get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.tasks.get(user, id);
  }

  @Post('tasks')
  @RequirePermissions(PERMISSION_KEYS.tasksWrite)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateTaskDto,
    @Req() request: Request,
  ) {
    return this.tasks.create(user, input, request.ip);
  }

  @Patch('tasks/:id')
  @RequirePermissions(PERMISSION_KEYS.tasksWrite)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: UpdateTaskDto,
    @Req() request: Request,
  ) {
    return this.tasks.update(user, id, input, request.ip);
  }

  @Post('tasks/:id/comments')
  @RequirePermissions(PERMISSION_KEYS.tasksWrite)
  comment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: CreateTaskCommentDto,
  ) {
    return this.tasks.comment(user, id, input);
  }

  @Post('tasks/:id/attachments')
  @RequirePermissions(PERMISSION_KEYS.tasksWrite)
  attachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: LinkFileDto,
  ) {
    return this.tasks.linkFile(user, id, input);
  }
}
