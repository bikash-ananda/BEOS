import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { Environment } from '../config/environment';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  set(response: Response, accessToken: string, refreshToken: string): void {
    response.cookie(ACCESS_COOKIE, accessToken, {
      ...this.baseOptions(),
      maxAge:
        this.config.get('AUTH_ACCESS_TTL_SECONDS', { infer: true }) * 1_000,
      path: '/api/v1',
    });
    response.cookie(REFRESH_COOKIE, refreshToken, {
      ...this.baseOptions(),
      maxAge:
        this.config.get('AUTH_REFRESH_TTL_DAYS', { infer: true }) *
        24 *
        60 *
        60 *
        1_000,
      path: '/api/v1/auth',
    });
  }

  clear(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, {
      ...this.baseOptions(),
      path: '/api/v1',
    });
    response.clearCookie(REFRESH_COOKIE, {
      ...this.baseOptions(),
      path: '/api/v1/auth',
    });
  }

  private baseOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('AUTH_COOKIE_SECURE', { infer: true }),
      domain: this.config.get('AUTH_COOKIE_DOMAIN', { infer: true }),
    };
  }
}
