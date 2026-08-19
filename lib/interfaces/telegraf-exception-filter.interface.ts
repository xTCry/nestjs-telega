import { ArgumentsHost } from '@nestjs/common';

export interface TelegrafExceptionFilter<T = unknown> {
  catch(exception: T, host: ArgumentsHost): unknown;
}
