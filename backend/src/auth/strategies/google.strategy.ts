import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { isDomainAllowed } from '../utils/domain.util';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_OAUTH_CLIENT_ID') || 'mock',
      clientSecret: configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET') || 'mock',
      callbackURL: configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<{ email: string, error?: string }> {
    const { emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('No email found in Google profile');
    }

    const allowedDomains = this.configService.get<string>('AUTH_ALLOWED_EMAIL_DOMAINS') || '';

    if (!isDomainAllowed(email, allowedDomains)) {
      return { email: email, error: 'Domain not allowed' };
    }

    return {
      email: email
    };
  }
}
