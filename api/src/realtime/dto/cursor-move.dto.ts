import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CursorMoveDto {
  @IsString()
  room: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;
}
