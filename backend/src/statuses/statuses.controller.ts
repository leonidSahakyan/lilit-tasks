import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Patch,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  CreateStatusDto,
  SaveColumnOrderDto,
  UpdateStatusDto,
} from './dto/status.dto';
import { CurrentUser } from '../auth/current-user.decorator';

import { StatusesService } from './statuses.service';

@Controller('statuses')
export class StatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  @Get()
  getAll() {
    return this.statusesService.getAll();
  }

  @Post()
  create(@Body() dto: CreateStatusDto) {
    return this.statusesService.create(dto.name, dto.initiatorSocketId);
  }

  @Post('order')
  async updateOrder(@Body() dto: SaveColumnOrderDto) {
    if (!dto.order || !Array.isArray(dto.order)) {
      return { success: false, message: 'Invalid order data' };
    }

    await this.statusesService.updateOrder(dto.order, dto.initiatorSocketId);
    return { success: true };
  }

  @Patch(':id')
  updateTitle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.statusesService.updateTitle(
      id,
      dto.name,
      dto.initiatorSocketId,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { role: 'admin' | 'user' },
  ) {
    return this.statusesService.remove(id, user.role);
  }
}
