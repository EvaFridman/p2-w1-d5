import {
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsIn,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../generated/prisma/index.js';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phone: string;

  @IsIn(['agent', 'moderator', 'client'])
  role: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(3)
  avatarFileName: string | null;
}
