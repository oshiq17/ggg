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
import { DebtorService } from './debtor.service';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { DebtorFilterDto } from './dto/debtor-filter.dto';

@Controller('debtor')
export class DebtorController {
  constructor(private readonly debtorService: DebtorService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createDebtorDto: CreateDebtorDto, @Req() req: Request) {
    const userId = req['user'].id;
    return this.debtorService.create(createDebtorDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('star/:id')
  updateStar(@Param('id') id: string) {
    return this.debtorService.updateStar(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'name'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  findAll(@Query() filter: DebtorFilterDto, @Req() req: Request) {
    const userId = req['user'].id;
    return this.debtorService.findAll(filter, userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debtorService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDebtorDto: UpdateDebtorDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.debtorService.update(id, updateDebtorDto, user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'];
    return this.debtorService.remove(id, user);
  }
}
