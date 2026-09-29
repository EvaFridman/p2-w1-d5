import { IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class ListFavoritesDto {
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
}
