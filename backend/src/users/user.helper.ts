import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

export async function checkPermission(
  user: { userId: number; role: 'admin' | 'user' },
  permission: string,
  userRepo: Repository<User>,
): Promise<boolean> {
  if (user.role === 'admin') return true;

  const dbUser = await userRepo.findOne({
    where: { id: user.userId },
    select: ['permissions'],
  });

  if (!dbUser) return false;

  return dbUser.permissions?.includes(permission) ?? false;
}