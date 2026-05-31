import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      ok: true,
      service: 'ai-newsletter-api',
      timestamp: new Date().toISOString(),
    };
  }
}
