import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserDto } from './user.entity';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll(): Promise<UserDto[]> {
    return this.usersService.getAll();
  }

  @Patch(':id/toggle-availability')
  toggleAvailability(
    @Param('id') id: string,
    @CurrentUser() user: { userId: number; role: string }, // текущий юзер
  ) {
    return this.usersService.toggleAvailability(+id, user);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
    @CurrentUser() user: { userId: number; role: string },
  ) {
    return this.usersService.updatePermissions(+id, permissions, user);
  }
}
