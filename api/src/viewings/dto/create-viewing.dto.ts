import {
  IsOptional,
  IsString,
  Length,
  MinLength,
  IsEmail,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateViewingDto {
  @IsString()
  @Length(2, 50)
  clientName: string;

  @IsString()
  @MinLength(5)
  clientPhone: string;

  @IsEmail()
  clientEmail: string;

  @Type(() => Date)
  @IsDate()
  preferredAt: Date;

  @IsOptional()
  @IsString()
  comment?: string;
}
