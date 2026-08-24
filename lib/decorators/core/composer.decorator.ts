import { Reflector } from '@nestjs/core';

/**
 * `@Composer` like Update decorator, executed before scene handlers.
 *
 * Тип `@Ctx()` параметра: {@link import('telegraf-hardened').Context}; для
 * конкретного listener-а допускается сузить его до `NarrowedContext`.
 */
export const TgComposer = Reflector.createDecorator();

/** Alias for {@link TgComposer}. */
export const Composer = TgComposer;
