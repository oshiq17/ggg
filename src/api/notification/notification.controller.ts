import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { Request } from 'express';
import { FilterDto } from 'src/common/dto/filter.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    return this.notificationService.create(createNotificationDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'debtorId', required: false, type: String })
  @ApiQuery({
    name: 'get',
    required: false,
    enum: ['All', 'Sended'],
    description: 'Фильтрация по типу уведомлений',
  })
  findAll(
    @Req() req: Request,
    @Query() filter: FilterDto,
    @Query('debtorId') debtorId?: string,
    @Query('get') get?: 'All' | 'Sended',
  ) {
    const userId = req['user'].id;
    return this.notificationService.findAll(filter, debtorId, userId, get);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id;
    return this.notificationService.update(id, updateNotificationDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = req['user'].id;

    return this.notificationService.remove(id, userId);
  }
}
