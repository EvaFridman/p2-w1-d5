import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSavedSearchDto {
  // Bounded so the value fits the unique (userId, query) index.
  @IsString()
  @MaxLength(2000)
  query!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
