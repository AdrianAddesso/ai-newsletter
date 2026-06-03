import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '../utils/jwt.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken as string;

    if (!token) {
      throw new UnauthorizedException('No auth token found');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET') || '';
      const payload = await verifyToken(token, secret);
      
      const user = await this.prisma.users.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      if (user.state !== 'ACTIVE') {
        throw new ForbiddenException('User is not active');
      }

      request.user = user;
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
