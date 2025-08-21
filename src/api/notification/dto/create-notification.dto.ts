import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsUUID } from "class-validator"

export class CreateNotificationDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    debtorId: string
}
