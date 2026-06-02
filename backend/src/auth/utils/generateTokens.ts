import { ConfigService } from '@nestjs/config';
import { signToken } from '../utils/jwt.util';

export async function generateTokens(configService: ConfigService, userId: string, tokenVersion: number) {
    const accessSecret = configService.get<string>('JWT_ACCESS_SECRET') || 'access-secret';
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret';
    const accessTTL = configService.get<string>('ACCESS_TOKEN_TTL_MIN') || '15';
    const refreshTTL = configService.get<string>('REFRESH_TOKEN_TTL_DAYS') || '7';

    const accessToken = await signToken({ sub: userId }, accessSecret, `${accessTTL}m`);
    const refreshToken = await signToken({ sub: userId, version: tokenVersion }, refreshSecret, `${refreshTTL}d`);

    return { accessToken, refreshToken };
}