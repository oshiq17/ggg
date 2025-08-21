import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminFilterDto } from './dto/admin-filter.dto';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminRole, Status } from '@prisma/client';
import { VerifyDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/admin-login.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('super')
  async createSuper(
    @Body() createAdminDto: CreateAdminDto,
    @Query() filter: AdminFilterDto,
  ) {
    const admins = await this.adminService.findAll(filter);
    if (admins.data.length) {
      throw new HttpException('Endpoint no longer active', HttpStatus.GONE);
    }
    return this.adminService.createSuper(createAdminDto);
  }

  @Post('verifyOtp')
  verifyOtp(@Body() verifyDto: VerifyDto) {
    return this.adminService.verifyOtp(verifyDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.adminService.login(loginDto);
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
    return this.adminService.sendOtp(sendOtpDto.email);
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
    return this.adminService.refreshToken(data.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: Status })
  @ApiQuery({ name: 'role', required: false, enum: AdminRole })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'email'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @Get()
  findAll(@Query() filter: AdminFilterDto) {
    return this.adminService.findAll(filter);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', AdminRole.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @Req() req: Request,
  ) {
    return this.adminService.update(id, updateAdminDto, req);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const adminId = req['user'].id;
    return this.adminService.logout(adminId);
  }
}
