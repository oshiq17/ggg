import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDebtorDto } from './create-debtor.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDebtorDto extends PartialType(CreateDebtorDto) {}
