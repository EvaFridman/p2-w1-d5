import "server-only";
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] | null = null,
    public readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    if (Error.captureStackTrace) Error.captureStackTrace(this, ApiError);
  }
}
