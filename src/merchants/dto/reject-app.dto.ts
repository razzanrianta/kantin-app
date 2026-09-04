import { IsString } from "class-validator";

export class RejectAppDto {
    @IsString()
    rejectionReason!: string;
}