import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateSellerDto {
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
  
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  img: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  login: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}
