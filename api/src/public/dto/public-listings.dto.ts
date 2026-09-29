import { OmitType } from '@nestjs/mapped-types';
import { ListListingsDto } from '../../listings/dto/list-listings.dto.js';

export class PublicListingsDto extends OmitType(ListListingsDto, [
  'status',
] as const) {}
