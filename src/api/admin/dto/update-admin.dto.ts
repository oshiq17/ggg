import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAdminDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newPassword?: string;
}
