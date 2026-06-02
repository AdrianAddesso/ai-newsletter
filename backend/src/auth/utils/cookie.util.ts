import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  configService: ConfigService
) {
  const isSecure = configService.get<string>('AUTH_COOKIE_SECURE') === 'true';
  const sameSite = configService.get<string>('AUTH_COOKIE_SAMESITE') || 'Lax';
  const accessTTL = parseInt(configService.get<string>('ACCESS_TOKEN_TTL_MIN') || '15', 10);
  const refreshTTL = parseInt(configService.get<string>('REFRESH_TOKEN_TTL_DAYS') || '7', 10);

  const commonOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: sameSite as any,
    path: '/'
  };

  res.cookie('accessToken', accessToken, {
    ...commonOpts,
    maxAge: accessTTL * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...commonOpts,
    maxAge: refreshTTL * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response, configService: ConfigService) {
  const isSecure = configService.get<string>('AUTH_COOKIE_SECURE') === 'true';
  const sameSite = configService.get<string>('AUTH_COOKIE_SAMESITE') || 'Lax';
  
  const opts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: sameSite as any,
    path: '/'
  };

  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', opts);
}
