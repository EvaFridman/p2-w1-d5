import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ViewingStatus } from '../../generated/prisma/index.js';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsEnum(ViewingStatus, {
    message:
      'status must be one of the following values: CREATED, PENDING_APPROVAL, APPROVED, REJECTED, CLOSED',
  })
  status: ViewingStatus;
}
