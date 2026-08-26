# Complete app sample

Пример запускает два независимых bot instance. Основной bot полезен и сам по
себе: он показывает NestJS-декораторы, меню и управление правилами ответов.
Второй bot включается опционально и предназначен для Telegram Business.

| Bot | Когда включён | Что делает |
| --- | --- | --- |
| default | всегда, с `BOT_TOKEN` | Отвечает на текст, показывает форматирование и Bot API 9.4 keyboards, даёт администратору настраивать автоматические ответы. |
| `business` | при `BUSINESS_BOT_TOKEN` | Принимает Telegram Business updates подключённого Premium account, помечает сообщения прочитанными, отвечает текстом/sticker и ставит reactions. |

Это не MTProto userbot: Telegram Business подключает обычный bot к Premium
account и передаёт ему только разрешённые Business updates.

## Что попробовать в Telegram

После запуска Telegram-меню команд регистрируется автоматически через
`setMyCommands`. Достаточно открыть чат с основным bot и отправить `/start`.

- `/help` — краткая карта возможностей sample.
- Любой текст — Unicode-safe echo: emoji не превращаются в повреждённые
  символы при развороте строки.
- `/format`, `/keyboard`, `/menu` — форматированный текст, inline и reply
  keyboards соответственно. В `/keyboard` кнопки демонстрируют callback
  acknowledgement, декларативное редактирование сообщения и клавиатуры, а
  также удаление сообщения.
- `/features` — список подключённых возможностей telegraf-hardened.
- Inline mode — включите inline mode для bot через `/setinline` в BotFather,
  затем напишите `@bot_username запрос` в любом чате. Sample возвращает
  три страницы по три результата, передаёт `next_offset` и выбирает
  `cache_time` в зависимости от того, пустой запрос или нет.
- `/admin` — панель администратора. Доступна только ID из `ADMIN_IDS`.
  Здесь можно включать/выключать automatic replies, добавлять text/sticker/
  reaction и посмотреть сохранённые значения. Callback-кнопки обновляют одно
  и то же сообщение, а не засоряют чат новыми сообщениями.
- `/remove <text|sticker|reaction> <number>` — удаляет сохранённый вариант.
- `/buttonemoji <custom emoji>` — для администратора выводит ID custom emoji.
  Скопируйте его в `BUTTON_CUSTOM_EMOJI_ID` файла `.env` и перезапустите
  sample: emoji появится на кнопках, если bot owner имеет Telegram Premium
  либо дополнительные usernames на Fragment.

Для optional Business bot отправьте сообщение подключённому Business account.
Он использует текстовые и sticker-варианты из панели, отмечает сообщение
прочитанным и добавляет reaction. В этом чате `/dialogue` включает сцену, а
`/leave` возвращает обычную обработку.

## Локальная проверка

1. Скопируйте `.env.example` в `.env` и укажите `BOT_TOKEN`.
   `BUSINESS_BOT_TOKEN` необязателен: без него запускается только основной bot.
2. Укажите в `ADMIN_IDS` собственный numeric Telegram user ID через запятую.
   Только эти пользователи могут вызывать `/admin` и менять варианты ответов.
3. Для Business режима создайте второй bot в BotFather и подключите его в
   Telegram Business settings нужного Premium account, выдав необходимые права
   на чтение и отправку сообщений.
4. Из корня репозитория соберите библиотеку и sample:

   ```bash
   npm run build
   npm run build:sample
   ```

5. Запустите sample из корня проекта:

   ```bash
   npm run start:sample
   ```

   ```bash
   npm run start:sample:dev
   ```

   Альтернатива из папки sample:

   ```bash
   npm run start --prefix sample/01-complete-app -- --no-shell
   npm run start:dev --prefix sample/01-complete-app -- --no-shell
   ```

Для compile-only проверки без запуска Telegram-ботов используйте из корня:

```bash
npm run build:sample
```

## Проверка telegraf-hardened

В `BusinessUpdate` обработчик `@Reaction('👍')` проверяет, что
NestJS-декоратор корректно регистрирует новый `Composer.reaction` API из
telegraf-hardened.
Чтобы Telegram доставлял такие update-ы, бот должен быть администратором чата,
а `message_reaction` — присутствовать в `launchOptions.allowedUpdates`.

Для обоих bot instances в `launchOptions.polling` включён `retryOnConflict`,
чтобы telegraf-hardened повторял long-polling после HTTP 409 при быстром
перезапуске приложения.

Варианты ответов сохраняются в JSON-файл
`sample/01-complete-app/data/business-responses.json`. Файл создаётся только
после первого изменения через админ-бота и намеренно не отслеживается Git.
Переменная `BUSINESS_RESPONSES_FILE` позволяет задать другой абсолютный путь.

### Команды для ручной проверки

- Основной bot: `/format`, `/keyboard`, `/menu`, `/admin`, inline query и
  текстовое сообщение. Для inline query сначала включите режим через
  `/setinline` в BotFather, затем используйте `@bot_username запрос`: scrolling
  проверяет pagination через `next_offset`, а повторный поиск — Telegram cache.
  В `/keyboard` нажмите `Acknowledge`, затем `Edit message`; новая клавиатура
  позволяет проверить декларативные `editMessage`, `editReplyMarkup` и
  `deleteMessage` listener results.
  `/admin` открывает цветные Bot API 9.4 inline-кнопки. При заданном
  `BUTTON_CUSTOM_EMOJI_ID` они также используют `icon_custom_emoji_id`.
  ID не универсален: получите подходящий через `/buttonemoji <custom emoji>`.
- Через админ-панель добавьте text reply, sticker или одну из типизированных
  реакций. Для sticker отправьте сам sticker, затем нажмите clickable
  `Save response`. Сохранение или отмена возвращает в панель с текущим
  состоянием и action-кнопками. Для удаления используйте
  `/remove <text|sticker|reaction> <number>`.
- После подключения Business bot отправьте сообщение connected business account:
  sample использует `ctx.bizConnId`, `ctx.text`, `ctx.msg`, `ctx.msgId`,
  `ctx.entities()`-совместимую типизацию и `readBusinessMessage`, а затем
  отвечает через business-aware `ctx.reply()`. Sticker вызывает ответный
  sticker или `ctx.react('👍')`.
- В business dialog `/dialogue` и `/leave` проверяют сцену поверх
  `business_message`. Реакция 👍 и `message_reaction_count` проверяют
  `@Reaction()` и актуальные reaction updates; для них bot должен быть
  администратором чата.
