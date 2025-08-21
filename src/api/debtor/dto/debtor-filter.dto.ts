import { IsOptional, IsString } from 'class-validator';
import { FilterDto } from 'src/common/dto/filter.dto';

export class DebtorFilterDto extends FilterDto {
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'name' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
