import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private blacklistedTokens = new Set<string>();
  
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) return null;

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return null;

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    await this.usersService.update(user.id, { lastSeen: new Date() });
    
    const payload = { username: user.username, sub: user.id, role: user.role};
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async invalidateToken(token: string) {
    this.blacklistedTokens.add(token);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistedTokens.has(token);
  }
}
