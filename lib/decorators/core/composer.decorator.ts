import { Reflector } from '@nestjs/core';

/**
 * `@Composer` like Update decorator, executed before scene handlers.
 */
export const Composer = Reflector.createDecorator();
