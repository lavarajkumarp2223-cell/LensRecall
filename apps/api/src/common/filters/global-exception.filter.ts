import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCodes } from '@lensrecall/shared';

/**
 * GlobalExceptionFilter — catches all unhandled exceptions and returns
 * a consistent API error response.
 *
 * Response format:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "EVENT_NOT_FOUND",
 *     "message": "The requested event could not be found."
 *   }
 * }
 *
 * NEVER exposes:
 * - Stack traces
 * - Internal error details
 * - Database errors
 * - Service credentials
 * - File paths
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: string = ErrorCodes.INTERNAL_ERROR;
    let message = 'An unexpected error occurred. Please try again.';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        errorCode = (resp['code'] as string) ?? this.statusToErrorCode(statusCode);
        message = (resp['message'] as string) ?? exception.message;
        details = resp['details'] as Record<string, unknown> | undefined;
      } else {
        message = exceptionResponse as string;
        errorCode = this.statusToErrorCode(statusCode);
      }
    } else if (exception instanceof Error) {
      // Log internal errors with full detail — but never return them to client
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    // Never expose internal errors in production
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR && process.env['NODE_ENV'] === 'production') {
      message = 'An unexpected error occurred. Please try again.';
      details = undefined;
    }

    void response.status(statusCode).send({
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details ? { details } : {}),
      },
    });
  }

  private statusToErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: ErrorCodes.VALIDATION_ERROR,
      401: ErrorCodes.UNAUTHORIZED,
      403: ErrorCodes.FORBIDDEN,
      404: ErrorCodes.NOT_FOUND,
      429: ErrorCodes.RATE_LIMITED,
      500: ErrorCodes.INTERNAL_ERROR,
      503: ErrorCodes.SERVICE_UNAVAILABLE,
    };
    return map[status] ?? ErrorCodes.INTERNAL_ERROR;
  }
}
