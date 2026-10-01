import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ListingStatus } from '../../generated/prisma/index.js';

export class UpdateListingStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(ListingStatus, {
    message:
      'status must be one of the following values: DRAFT, MODERATION, PUBLISHED, REJECTED, UNPUBLISHED',
  })
  status: ListingStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
