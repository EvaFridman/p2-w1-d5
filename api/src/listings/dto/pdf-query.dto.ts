import { IsEnum, IsOptional } from 'class-validator';

export class PdfQueryDto {
  @IsOptional()
  @IsEnum(['view', 'download'])
  mode?: 'view' | 'download' = 'view';
}
