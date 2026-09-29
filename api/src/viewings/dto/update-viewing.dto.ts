import { PartialType } from '@nestjs/mapped-types';
import { CreateViewingDto } from './create-viewing.dto.js';

export class UpdateViewingDto extends PartialType(CreateViewingDto) {}
