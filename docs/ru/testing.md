# Тестирование Telegram-ботов

`nestjs-telega/testing` предоставляет `FakeTelegramApi` — расширяемый локальный
fake Bot API для проверки Nest-обработчиков и настоящего Telegraf polling без
сети Telegram. Готовый пример: [polling.spec.ts](../../sample/01-complete-app/src/testing/polling.spec.ts).

Запустите fake, передайте `api.url` в `options.telegram.apiRoot` и установите
`launchOptions: false`. После инициализации Nest получите бота, вызовите
`bot.launch()` и дождитесь `api.waitForPolling()`. Передавайте update через
`pushText`, `pushCallback` или `pushUpdate`, а исходящие вызовы проверяйте
через `waitForCall` или `waitForNextCall`.

`onMethod` добавляет обработчик метода; `failNext` имитирует ошибку API.
`reset` очищает вызовы, очередь, сообщения и ошибки, сохраняя обработчики и
polling. При завершении остановите бота, дождитесь завершения `launch`, затем
закройте Nest-модуль и fake.

Для быстрой проверки без polling задайте `bot.botInfo` и передайте raw update в
`bot.handleUpdate()`. При этом HTTP transport не проверяется. Fake реализует
только часть методов и не подтверждает работу реального Telegram и его клиентов.
