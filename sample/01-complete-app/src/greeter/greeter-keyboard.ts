import { Markup } from 'telegraf-hardened';

/** Навигация после завершения или отмены примера. */
export const createGreeterMenu = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Random number', 'greeter:scene'),
      Markup.button.callback('Greeting wizard', 'greeter:wizard'),
    ],
    [Markup.button.callback('Explore features', 'greeter:features')],
  ]);

export const createSceneKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('Generate number', 'scene:random')],
    [Markup.button.callback('Back to examples', 'scene:leave')],
  ]);

export const createWizardKeyboard = () =>
  Markup.inlineKeyboard([Markup.button.callback('Cancel', 'wizard:cancel')]);
