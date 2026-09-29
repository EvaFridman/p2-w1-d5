import { PipeTransform, Injectable } from '@nestjs/common';
import path from 'path';
import { ValidationError } from '../../errors/app.exception.js';

@Injectable()
export class PhotoValidationPipe implements PipeTransform {
  private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  private readonly ALLOWED_MIME_TYPES = /^image\/(jpeg|png|webp)$/;
  private readonly MAX_SIZE = 5 * 1024 * 1024;

  transform(value: Express.Multer.File[] | Express.Multer.File): Express.Multer.File[] | Express.Multer.File {
    if (!value) return value;
    const files = Array.isArray(value) ? value : [value];

    for (const file of files) {
      if (file.size > this.MAX_SIZE)
        throw new ValidationError('File is too large', null, 'FILE_TOO_LARGE');
      if (!this.ALLOWED_MIME_TYPES.test(file.mimetype))
        throw new ValidationError('Unsupported file type', null, 'UNSUPPORTED_FILE_TYPE');
      const ext = path.extname(file.originalname).toLowerCase();
      if (!this.ALLOWED_EXTENSIONS.includes(ext))
        throw new ValidationError('Unsupported file extension', null, 'UNSUPPORTED_FILE_TYPE');
    }

    return value;
  }
}
