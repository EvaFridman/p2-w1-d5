import { IsString, MinLength, Matches } from 'class-validator';
import { LoginDto } from './login.dto.js';

export class RegisterDto extends LoginDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phone: string;
}
