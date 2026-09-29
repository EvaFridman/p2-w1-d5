import {
  IsOptional,
  IsPositive,
  IsInt,
  IsIn,
  IsString,
  IsNumber,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DealType, PropertyType } from '../../generated/prisma/index.js';

export class CreateListingDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  districtId: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  @IsIn(['sale', 'rent'])
  dealType: DealType;

  @IsString()
  @IsIn(['flat', 'house', 'room', 'commercial'])
  propertyType: PropertyType;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  area: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  rooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  floor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  totalFloors?: number;

  @IsString()
  address: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
