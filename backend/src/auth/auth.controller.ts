import { Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { setAuthCookies, clearAuthCookies } from './utils/cookie.util';
import { JwtGuard } from './guards/jwt.guard';

type currentUser = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: string;
  state: string;
  area_id: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google/start')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    try {
      const user = req.user as currentUser & { error?: string };

      if (user.error) {
        return res.redirect(`${frontendUrl}/auth/callback`);
      }

      const tokens = await this.authService.handleGoogleAuth(user);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken, this.configService);
      return res.redirect(`${frontendUrl}/dashboard`);
      
    } catch (error: any) {
      this.logger.error('Error during Google authentication callback', error);
      return res.redirect(`${frontendUrl}/auth/callback`);
    }
  }

  @Post('refresh')
  async refreshSession(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const tokens = await this.authService.refreshSession(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, this.configService);
    
    return res.json({ ok: true });
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@Req() req: Request){

    const user = req.user as currentUser;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.last_name,
      role: user.role,
      state: user.state,
      areaId: user.area_id,
    };
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(@Req() req: Request, @Res() res: Response) {

    const user = req.user as currentUser;
    
    await this.authService.logout(user.id);

    clearAuthCookies(res, this.configService);

    return res.json({ ok: true });
  }
}
