import { IsOptional, IsPositive, IsInt, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ViewingStatus } from '../../generated/prisma/index.js';

export class ListViewingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(ViewingStatus))
  status?: ViewingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  listingId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
