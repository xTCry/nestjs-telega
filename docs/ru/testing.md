# Тестирование Telegram-ботов

`nestjs-telega/testing` предоставляет `FakeTelegramApi` — расширяемый локальный
fake Bot API для проверки Nest-обработчиков и настоящего Telegraf polling без
сети Telegram. Готовый пример: [polling.spec.ts](https://github.com/xTCry/nestjs-telega/blob/main/sample/01-complete-app/src/testing/polling.spec.ts).

Запустите fake, передайте `api.url` в `options.telegram.apiRoot` и установите
`launchOptions: false`. После инициализации Nest получите бота, вызовите
`bot.launch()` и дождитесь `api.waitForPolling()`. Передавайте update через
`pushText`, `pushCallback` или `pushUpdate`, а исходящие вызовы проверяйте
через `waitForCall` или `waitForNextCall`.
В sample также проверяются реальные callback-обработчики клавиатуры и отдельные
wizard-сессии двух пользователей. Тест rich message показывает регистрацию
ответа `sendRichMessage` через `onMethod`; тест ephemeral message проверяет ID
сообщения и получателя. Доступность и отображение Telegram они не подтверждают.

## Проверка вызовов и свои методы

Fake сохраняет вызовы в виде `{ method, params, result }`. Запомните количество
вызовов перед действием, чтобы ожидать новый ответ, а не найти старый:

```ts
const after = api.calls.length;
const user = { id: 42, firstName: 'Test' };
api.pushText(user, '/start');
const reply = await api.waitForNextCall(
  after,
  'sendMessage',
  (call) => Number(call.params.chat_id) === user.id,
);
expect(reply.params.text).toContain('Welcome');
```

Для отсутствующего метода задайте ответ нужной формы, а для проверки ошибок
используйте `failNext`:

```ts
api.onMethod('getMyStarBalance', () => ({ amount: 5, nanostar_amount: 0 }));
api.failNext('sendMessage', {
  error_code: 403,
  description: 'Forbidden: bot was blocked by the user',
});
```

`onMethod` переопределяет встроенный ответ; `failNext` действует на следующий
вызов метода. В callback-сценарии получите сообщение через
`api.getMessageWithCallback(data)` и передайте его в `pushCallback`.

`onMethod` добавляет обработчик метода; `failNext` имитирует ошибку API.
`reset` очищает вызовы, очередь, сообщения и ошибки, сохраняя обработчики и
polling. При завершении остановите бота, дождитесь завершения `launch`, затем
закройте Nest-модуль и fake.

Перед сбросом дождитесь завершения нужной асинхронной работы обработчика:
один наблюдаемый API-вызов ещё не означает завершение всей цепочки middleware.

В `FakeTelegramApi.start({ botInfo, fallback })` можно задать данные бота и
обработчик неизвестных методов; по умолчанию такие методы завершаются ошибкой.
Поддерживаются JSON, URL-encoded и текстовые multipart-поля; содержимое файлов
не сохраняется.

Для быстрой проверки без polling задайте `bot.botInfo` и передайте raw update в
`bot.handleUpdate()`. При этом HTTP transport не проверяется. Fake реализует
только часть методов и не подтверждает работу реального Telegram и его клиентов.
