import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { API_KEY_PREFIX, ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private authService: AuthService,
    private apiKeys: ApiKeysService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.url === '/api/auth/login') return true;

    // Bots and agents authenticate with a long-lived API key instead of a JWT.
    const header: string = request.headers['authorization'] || '';
    if (header.startsWith(`Bearer ${API_KEY_PREFIX}`)) {
      const user = await this.apiKeys.validate(header.slice('Bearer '.length));
      if (!user) throw new UnauthorizedException('Invalid API key');
      request.user = user;
      return true;
    }

    const can = await super.canActivate(context);
    if (!can) return false;

    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');
    const blacklisted = await this.authService.isTokenBlacklisted(token);
    if (blacklisted) throw new UnauthorizedException('Token has been invalidated');

    return true;
  }
}
