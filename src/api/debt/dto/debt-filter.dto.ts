import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { FilterDto } from 'src/common/dto/filter.dto';

export class DebtFilterDto extends FilterDto {
  @IsOptional()
  @IsString()
  debtorId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
