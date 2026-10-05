import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ApiKey } from './api-key.entity';

export const API_KEY_PREFIX = 'lt_';

export const hashApiKey = (key: string) => createHash('sha256').update(key).digest('hex');

@Injectable()
export class ApiKeysService {
  constructor(@InjectRepository(ApiKey) private readonly repo: Repository<ApiKey>) {}

  // Returns the user the key acts as, in the same shape the JWT strategy produces.
  async validate(key: string): Promise<{ userId: number; role: 'admin' | 'user' } | null> {
    const apiKey = await this.repo.findOne({ where: { keyHash: hashApiKey(key), revokedAt: IsNull() } });
    if (!apiKey || !apiKey.user || !apiKey.user.available) return null;

    const stale = !apiKey.lastUsedAt || Date.now() - apiKey.lastUsedAt.getTime() > 60_000;
    if (stale) await this.repo.update(apiKey.id, { lastUsedAt: new Date() });

    return { userId: apiKey.user.id, role: apiKey.user.role };
  }
}
