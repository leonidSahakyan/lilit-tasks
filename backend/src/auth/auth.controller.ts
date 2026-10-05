import { Controller, Post, Body, UnauthorizedException, BadRequestException, Headers  } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) throw new BadRequestException('Username and password required');
    
    const user = await this.authService.validateUser(body.username, body.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const { access_token } = await this.authService.login(user);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new BadRequestException('Authorization header missing');

    const token = authHeader.replace('Bearer ', '');
    await this.authService.invalidateToken(token);

    return { message: 'Logged out successfully' };
  }
}
