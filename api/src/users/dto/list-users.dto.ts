import { IsOptional, IsPositive, IsInt, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole as PrismaUserRole } from '../../generated/prisma/index.js';
export type UserRole = PrismaUserRole;

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit: number;

  @IsOptional()
  @IsString()
  @IsIn(['agent', 'moderator', 'client'])
  role?: UserRole;
}
