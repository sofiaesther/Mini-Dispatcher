import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttp
      ? exception.message
      : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    if (!isHttp && exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const body: { statusCode: number; message: string; error?: string } = {
      statusCode: status,
      message: typeof message === 'string' ? message : 'Internal server error',
    };
    if (isHttp && exception instanceof HttpException) {
      const errResponse = exception.getResponse();
      if (typeof errResponse === 'object' && errResponse !== null && 'message' in errResponse) {
        body.message = Array.isArray((errResponse as { message: unknown }).message)
          ? (errResponse as { message: string[] }).message[0]
          : (errResponse as { message: string }).message;
      }
    }

    res.status(status).json(body);
  }
}
