import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { generateTokens } from './utils/generateTokens';
import { verifyToken } from './utils/jwt.util';
import { JWTPayload } from 'jose';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async handleGoogleAuth(profile: { email: string }) {
    const { email } = profile;

    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ForbiddenException('User not found in the system');
    }

    if (user.state !== 'ACTIVE') {
      throw new ForbiddenException('User is not active');
    }

    return generateTokens(this.configService, user.id, user.refresh_token_version);
  }

  async refreshSession(token: string) {
    
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || "";
    
    let payload = null as JWTPayload | null;
    
    try {
      payload = await verifyToken(token, secret);
    } catch (e: unknown) {
      throw new UnauthorizedException('Invalid or expired refresh token', (e as Error).message);
    }

    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.state !== 'ACTIVE') {
      throw new ForbiddenException('User is not active');
    }

    if (user.refresh_token_version !== payload.version) {
      await this.prisma.users.update({
        where: { id: user.id },
        data: { refresh_token_version: { increment: 1 } },
      });
      throw new UnauthorizedException('Refresh token revoked');
    }

    return generateTokens(this.configService, user.id, user.refresh_token_version);
  }

  async logout(userId: string) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { refresh_token_version: { increment: 1 } },
    });
  }
}
