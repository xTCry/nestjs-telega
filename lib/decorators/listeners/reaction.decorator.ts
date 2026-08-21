import type { Composer } from 'telegraf-hardened';

import { ListenerDecorator } from '../../utils';

type ReactionDecorator = ReturnType<
  typeof ListenerDecorator<Composer<never>, 'reaction'>
>;

/**
 * Регистрирует обработчик изменения реакции на сообщение.
 *
 * @see https://github.com/telegraf-hardened/telegraf-hardened#working-with-reactions
 */
export const TgReaction: ReactionDecorator = ListenerDecorator('reaction');

/** Alias for {@link TgReaction}. */
export { TgReaction as Reaction };
