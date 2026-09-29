import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string,
    status: number,
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super({ message, details, code }, status);
  }
}

export class NotFoundError extends AppException {
  constructor(
    message = 'Not found',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 404, details, code);
  }
}

export class ConflictError extends AppException {
  constructor(
    message = 'Conflict',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 409, details, code);
  }
}

export class ValidationError extends AppException {
  constructor(
    message = 'Validation failed',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 422, details, code);
  }
}

export class ExternalServiceError extends AppException {
  constructor(
    message = 'External service error',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 502, details, code);
  }
}

export class UnauthorizedError extends AppException {
  constructor(
    message = 'Unauthorized',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 401, details, code);
  }
}

export class UnprocessableEntityError extends AppException {
  constructor(
    message = 'UnprocessableEntity',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 422, details, code);
  }
}

export class ForbiddenError extends AppException {
  constructor(
    message = 'Forbidden',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 403, details, code);
  }
}

export class TooManyRequestsError extends AppException {
  constructor(
    message = 'Too many requests',
    details: string[] | null = null,
    code: string | null = null,
  ) {
    super(message, 429, details, code);
  }
}
