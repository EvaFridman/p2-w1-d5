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
      const errorObj = error as any;
      message = errorObj.message || message;
      details = errorObj.details || null;
      code = errorObj.code || null;
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
