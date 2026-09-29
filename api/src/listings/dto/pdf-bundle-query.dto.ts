import {
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class PdfBundleQueryDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.split(',').map((id) => parseInt(id.trim(), 10));
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ids!: number[];

  @IsOptional()
  @IsEnum(['view', 'download'])
  mode?: 'view' | 'download' = 'view';
}
