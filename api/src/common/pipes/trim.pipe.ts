import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata) {
    if (typeof value === 'string') return value.trim();

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const keyValue = obj[key];
          if (typeof keyValue === 'string') {
            obj[key] = keyValue.trim();
          }
        }
      }
      return obj;
    }

    return value;
  }
}
