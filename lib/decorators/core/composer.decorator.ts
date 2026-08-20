import { Reflector } from '@nestjs/core';

/**
 * `@Composer` like Update decorator, executed before scene handlers.
 */
export const TgComposer = Reflector.createDecorator();

/** Alias for {@link TgComposer}. */
export const Composer = TgComposer;
