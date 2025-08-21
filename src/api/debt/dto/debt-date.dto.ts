import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class DebtDaterDto{
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date: Date;
}
