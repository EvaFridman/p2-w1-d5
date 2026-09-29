import { PipeTransform, Injectable } from '@nestjs/common';
import { AppException } from '../../errors/app.exception.js';

@Injectable()
export class SafeFilenamePipe implements PipeTransform<string, string> {
  private readonly SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;

  transform(value: string): string {
    if (!value || typeof value !== 'string')
      throw new AppException(
        'Invalid file name format',
        400,
        null,
        'BAD_REQUEST',
      );
    if (value.includes('..') || value.includes('/') || value.includes('\\'))
      throw new AppException(
        'Path traversal attempts or invalid characters detected',
        400,
        null,
        'INVALID_FILENAME',
      );
    if (!this.SAFE_FILENAME_REGEX.test(value))
      throw new AppException(
        'Filename contains unsupported special characters',
        400,
        null,
        'INVALID_FILENAME',
      );

    return value;
  }
}
