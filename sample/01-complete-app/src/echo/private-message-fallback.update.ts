import {
  ListenerPhase,
  Message,
  On,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';

/** Последний обработчик обычных текстов, не обработанных более узкими listener-ами. */
@Update()
export class PrivateMessageFallbackUpdate {
  @ListenerPhase('fallback')
  @On('text')
  onUnhandledText(@Message('text') text: string): TelegrafListenerResult {
    if (text.startsWith('/')) {
      return;
    }

    return 'No specialized handler matched this message.';
  }
}
