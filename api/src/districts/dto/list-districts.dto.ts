import { IsOptional, IsPositive, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDistrictsDto {
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
  city?: string;
}
