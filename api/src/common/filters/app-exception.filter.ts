import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: PinoLogger) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response>();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse() as Record<string, unknown>;

            if (status === HttpStatus.BAD_REQUEST && Array.isArray(body.message)) {
                return response.status(status).json({
                    data: null,
                    error: {
                        message: 'Validation failed',
                        details: body.message,
                        code: body.code ?? null,
                    },
                    meta: null,
                });
            }

            return response.status(status).json({
                data: null,
                error: {
                    message: body.message ?? exception.message,
                    details: body.details ?? null,
                    code: body.code ?? null,
                },
                meta: null,
            });
        }
        this.logger.error({ err: exception }, "Unhandled exception");

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
