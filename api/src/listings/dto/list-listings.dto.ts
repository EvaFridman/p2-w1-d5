import {
  IsOptional,
  IsPositive,
  IsInt,
  IsIn,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  DealType,
  PropertyType,
  ListingStatus,
} from '../../generated/prisma/index.js';

export class ListListingsDto {
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
  @IsIn(['sale', 'rent'])
  dealType?: DealType;

  @IsOptional()
  @IsString()
  @IsIn(['flat', 'house', 'room', 'commercial'])
  propertyType?: PropertyType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  districtId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'moderation', 'published', 'rejected', 'unpublished'])
  status?: ListingStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  rooms?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  areaMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  areaMax?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['price', 'area', 'publishedAt', 'createdAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  agentId?: number;
}
