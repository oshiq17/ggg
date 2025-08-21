import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDebtorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  note: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  phones: Array<string>;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  images: Array<string>;
}
