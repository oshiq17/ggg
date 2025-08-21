import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { SellerService } from './seller.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { AdminRole } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SellerFilterDto } from './dto/seller-filter.dto';
import { LoginDto } from '../admin/dto/admin-login.dto';
import { VerifyDto } from '../admin/dto/verify-otp.dto';
import { Request } from 'express';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    const id = req['user'].id;
    return this.sellerService.me(id);
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newPassword: {
          type: 'string',
          format: 'text',
          example: 'newPassword',
        },
      },
      required: ['newPassword'],
    },
  })
  @Patch('password/:id')
  updatePass(
    @Body() newPassword: { newPassword: string },
    @Param('id') id: string,
  ) {
    return this.sellerService.updatePass(newPassword.newPassword, id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @Post()
  create(@Body() createSellerDto: CreateSellerDto) {
    return this.sellerService.create(createSellerDto);
  }

  @Post('sendOtp')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'example@mail.com',
        },
      },
      required: ['email'],
    },
  })
  sendOtp(@Body() sendOtpDto: { email: string }) {
    return this.sellerService.sendOtp(sendOtpDto.email);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.sellerService.login(loginDto);
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          format: 'text',
          example: 'refreshToken',
        },
      },
      required: ['refreshToken'],
    },
  })
  @Post('refresh')
  async refreshTokens(@Body() data: { refreshToken: string }) {
    return this.sellerService.refreshToken(data.refreshToken);
  }

  @Post('verifyOtp')
  verifyOtp(@Body() verifyDto: VerifyDto) {
    return this.sellerService.verifyOtp(verifyDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'phoneNumber', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'email', 'fullName', 'wallet'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() filterDto: SellerFilterDto) {
    return this.sellerService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sellerService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSellerDto: UpdateSellerDto,
    @Req() req: Request,
  ) {
    return this.sellerService.update(id, updateSellerDto, req);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sellerService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const sellerId = req['user'].id;
    return this.sellerService.logout(sellerId);
  }
}
