import { ArgumentsHost } from '@nestjs/common';

export interface TgArgumentsHost extends ArgumentsHost {
  getContext<T = unknown>(): T;
  getNext<T = unknown>(): T;
}
