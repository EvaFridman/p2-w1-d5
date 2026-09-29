import { IsString, Matches, MinLength } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @IsString()
  @MinLength(2)
  city: string;
}
