import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserDto } from './user.entity';
import { SocketService } from '../services/socket.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private readonly socketService: SocketService,
  ) {}

  // Return proper UserDto[]
  async getAll(): Promise<UserDto[]> {
    const users = await this.usersRepo.find({
      select: [
        'id',
        'username',
        'fullName',
        'available',
        'role',
        'permissions',
        'updatedAt',
        'lastSeen',
      ],
    });

    return users.map((u) => new UserDto(u));
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOneBy({ username });
  }

  async getById(id: number): Promise<UserDto | null> {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'fullName',
        'available',
        'role',
        'permissions',
        'updatedAt',
        'lastSeen',
      ],
    });
    return user ? new UserDto(user) : null;
  }

  async update(id: number, data: Partial<User>) {
    await this.usersRepo.update(id, data);
    const updatedUser = await this.getById(id);

    if (updatedUser) {
      const admins = await this.usersRepo.find({
        where: { role: 'admin' },
        select: ['id'],
      });

      admins.forEach((admin) => {
        this.socketService.emitToUser(admin.id, 'user.updated', updatedUser);
      });
    }

    return updatedUser;
  }

  // create(data: Partial<User>): Promise<User> {
  //   const user = this.usersRepo.create(data);
  //   return this.usersRepo.save(user);
  // }

  async toggleAvailability(
    id: number,
    currentUser: { userId: number; role: string },
  ) {
    if (currentUser.role !== 'admin')
      throw new ForbiddenException('Only admins can change availability');

    const user = await this.usersRepo.findOneBy({ id });
    if (!user) return null;

    user.available = !user.available;
    const saved = await this.usersRepo.save(user);
    const updatedUser = new UserDto(saved);

    // Получаем всех админов кроме того, кто делает изменение
    const admins = await this.usersRepo.find({
      where: { role: 'admin' },
      select: ['id'],
    });

    admins
      .forEach((admin) => {
        this.socketService.emitToUser(admin.id, 'user.updated', updatedUser);
      });

    if (user.id !== currentUser.userId) {
      this.socketService.emitToUser(user.id, 'user.updated', updatedUser);
    }

    return updatedUser;
  }

  async updatePermissions(
    id: number,
    permissions: string[],
    currentUser: { userId: number; role: string },
  ) {
    if (currentUser.role !== 'admin')
      throw new ForbiddenException('Only admins can change permissions');

    const user = await this.usersRepo.findOneBy({ id });
    if (!user) return null;

    user.permissions = permissions;
    const saved = await this.usersRepo.save(user);
    const updatedUser = new UserDto(saved);

    const admins = await this.usersRepo.find({
      where: { role: 'admin' },
      select: ['id'],
    });

    admins
      .forEach((admin) => {
        this.socketService.emitToUser(admin.id, 'user.updated', updatedUser);
      });

    if (user.id !== currentUser.userId) {
      this.socketService.emitToUser(user.id, 'user.updated', updatedUser);
    }

    return updatedUser;
  }
}
