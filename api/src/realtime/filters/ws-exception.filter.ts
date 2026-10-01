import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();

    let message = 'WebSocket Error';
    let details: string[] | null = null;
    let code: string | null = null;

    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;

      message =
        typeof errorObj.message === 'string' ? errorObj.message : message;
      details = Array.isArray(errorObj.details)
        ? (errorObj.details as string[])
        : null;
      code = typeof errorObj.code === 'string' ? errorObj.code : null;
    } else if (typeof error === 'string') {
      message = error;
    }

    const errorResponse = {
      data: null,
      error: { message, details, code },
      meta: null,
    };

    client.emit('exception', errorResponse);
  }
}
