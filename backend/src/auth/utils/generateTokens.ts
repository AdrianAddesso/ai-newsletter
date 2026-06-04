import { ConfigService } from '@nestjs/config';
import { signToken } from '../utils/jwt.util';

export async function generateTokens(configService: ConfigService, userId: string, tokenVersion: number) {
    const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    const accessTTL = configService.get<string>('ACCESS_TOKEN_TTL_MIN') || '15';
    const refreshTTL = configService.get<string>('REFRESH_TOKEN_TTL_DAYS') || '7';

    const accessToken = await signToken({ sub: userId }, accessSecret as string, `${accessTTL}m`);
    const refreshToken = await signToken({ sub: userId, version: tokenVersion }, refreshSecret as string, `${refreshTTL}d`);

    return { accessToken, refreshToken };
}