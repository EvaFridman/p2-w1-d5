import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request & { id?: string }>();
    const requestId = request.id;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown>;
      const code = body.code ?? null;

      if (status !== HttpStatus.NOT_FOUND) {
        const logData = { requestId, status, code, err: exception };
        if (status >= 500) this.logger.error(logData, 'HTTP exception');
        else this.logger.warn(logData, 'HTTP exception');
      }

      if (status === HttpStatus.BAD_REQUEST && Array.isArray(body.message)) {
        return response.status(status).json({
          data: null,
          error: {
            message: 'Validation failed',
            details: body.message,
            code,
          },
          meta: null,
        });
      }

      return response.status(status).json({
        data: null,
        error: {
          message: body.message ?? exception.message,
          details: body.details ?? null,
          code,
        },
        meta: null,
      });
    }

    this.logger.error({ requestId, err: exception }, 'Unhandled exception');

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      data: null,
      error: {
        message: 'Internal server error',
        details: null,
        code: null,
      },
      meta: null,
    });
  }
}
