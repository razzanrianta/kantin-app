import { IsPhoneNumber, IsString } from "class-validator";

export class ApplyMerchantDto {
    @IsString()
    name!: string;

    @IsString()
    description!: string;

    @IsString()
    location!: string;

    @IsPhoneNumber('ID')
    phone!: string;
}