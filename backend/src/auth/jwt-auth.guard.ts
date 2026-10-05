import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.url === '/api/auth/login') return true;

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
