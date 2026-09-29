import { IsOptional, IsInt, IsPositive, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePhotoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  position?: number;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}
