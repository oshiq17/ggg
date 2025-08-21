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
import { DebtService } from './debt.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { DebtFilterDto } from './dto/debt-filter.dto';
import { DebtDaterDto } from './dto/debt-date.dto';

@Controller('debt')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('paymant-history')
  pay(@Req() req: Request) {
    const sellerId = req['user'].id;
    return this.debtService.paymentsHistory(sellerId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createDebtDto: CreateDebtDto, @Req() req: Request) {
    const userId = req['user'].id;
    return this.debtService.create(createDebtDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('oneMonth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        debtId: {
          type: 'string',
          example: '1234',
        },
      },
      required: ['debtId'],
    },
  })
  oneMonthPay(@Body() data: { debtId: string }) {
    return this.debtService.oneMonthPay(data.debtId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('anyQuantity')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        debtId: {
          type: 'string',
          example: '1234',
        },
        amount: {
          type: 'number',
          example: '1234',
        },
      },
      required: ['debtId', 'amount'],
    },
  })
  anyQuantityPay(@Body() data: { debtId: string; amount: number }) {
    return this.debtService.anyQuantityPay(data.debtId, BigInt(data.amount));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('manyMonth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        debtId: {
          type: 'string',
          example: '1234',
        },
        months: {
          type: 'array',
          items: {
            type: 'number',
          },
          example: [1, 2, 3],
        },
      },
      required: ['debtId', 'months'],
    },
  })
  manyMonthPay(@Body() data: { debtId: string; months: Array<number> }) {
    return this.debtService.manyMonthPay(data.debtId, data.months);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('date')
  @ApiQuery({ name: 'date', required: false, type: Date })
  debtDate(@Query() data: DebtDaterDto, @Req() req: Request) {
    const sellerId = req['user'].id;
    return this.debtService.debtDate(data, sellerId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'debtorId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(@Query() filter: DebtFilterDto, @Req() req: Request) {
    const sellerId = req['user'].id;
    return this.debtService.findAll(filter, sellerId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debtService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDebtDto: UpdateDebtDto) {
    return this.debtService.update(id, updateDebtDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.debtService.remove(id);
  }
}
