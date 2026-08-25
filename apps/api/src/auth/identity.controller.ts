import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PERMISSION_KEYS } from '../rbac/permissions';
import { ACCESS_COOKIE } from './auth.constants';
import type { AuthenticatedUser } from './auth-user';
import { getClientContext } from './auth-request';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CreateInvitationDto, CreatePasswordResetDto } from './dto';
import { InvitationService } from './invitation.service';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Identity administration')
@ApiCookieAuth(ACCESS_COOKIE)
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly invitations: InvitationService,
    private readonly passwordResets: PasswordResetService,
  ) {}

  @RequirePermissions(PERMISSION_KEYS.invitationsManage)
  @Get('invitations')
  listInvitations() {
    return this.invitations.list();
  }

  @RequirePermissions(PERMISSION_KEYS.invitationsManage)
  @Post('invitations')
  createInvitation(
    @Body() input: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.invitations.create(input, user.id, getClientContext(request));
  }

  @RequirePermissions(PERMISSION_KEYS.invitationsManage)
  @Post('invitations/:id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.invitations.revoke(id, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.usersManage)
  @Post('password-resets')
  createPasswordReset(
    @Body() input: CreatePasswordResetDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.passwordResets.create(input.email, user.id, request.ip);
  }
}
