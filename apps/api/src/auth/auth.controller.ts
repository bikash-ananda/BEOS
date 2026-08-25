import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from './auth-user';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';
import { AuthCookieService } from './auth-cookie.service';
import { getClientContext, getCookie } from './auth-request';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  CompletePasswordResetDto,
  LoginDto,
} from './dto';
import { InvitationService } from './invitation.service';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly invitations: InvitationService,
    private readonly passwordResets: PasswordResetService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(input, getClientContext(request));
    this.cookies.set(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = getCookie(request, REFRESH_COOKIE);
    if (!refreshToken)
      throw new UnauthorizedException('Authentication required');

    const result = await this.auth.refresh(
      refreshToken,
      getClientContext(request),
    );
    this.cookies.set(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('accept-invite')
  async acceptInvitation(
    @Body() input: AcceptInvitationDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.invitations.accept(
      input,
      getClientContext(request),
    );
    this.cookies.set(response, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('complete-password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async completePasswordReset(
    @Body() input: CompletePasswordResetDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.passwordResets.complete(input, request.ip);
    this.cookies.clear(response);
  }

  @ApiCookieAuth(ACCESS_COOKIE)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @ApiCookieAuth(ACCESS_COOKIE)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(user.id, user.sessionFamilyId, request.ip);
    this.cookies.clear(response);
  }

  @ApiCookieAuth(ACCESS_COOKIE)
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logoutAll(user.id, request.ip);
    this.cookies.clear(response);
  }

  @ApiCookieAuth(ACCESS_COOKIE)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.changePassword(user.id, input, request.ip);
    this.cookies.clear(response);
  }
}
