import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FilterDto } from 'src/common/dto/filter.dto';

export class SellerFilterDto extends FilterDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'email' | 'fullName' | 'wallet' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
