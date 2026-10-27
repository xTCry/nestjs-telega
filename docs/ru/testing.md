# Тестирование Telegram-ботов

`nestjs-telega/testing` предоставляет `FakeTelegramApi` — расширяемый локальный
fake Bot API для проверки Nest-обработчиков и настоящего Telegraf polling без
сети Telegram. Готовый пример: [polling.spec.ts](../../sample/01-complete-app/src/testing/polling.spec.ts).

Запустите fake, передайте `api.url` в `options.telegram.apiRoot` и установите
`launchOptions: false`. После инициализации Nest получите бота, вызовите
`bot.launch()` и дождитесь `api.waitForPolling()`. Передавайте update через
`pushText`, `pushCallback` или `pushUpdate`, а исходящие вызовы проверяйте
через `waitForCall` или `waitForNextCall`.
В sample также проверяются реальные callback-обработчики клавиатуры и отдельные
wizard-сессии двух пользователей. Тест rich message показывает регистрацию
ответа `sendRichMessage` через `onMethod`; тест ephemeral message проверяет ID
сообщения и получателя. Доступность и отображение Telegram они не подтверждают.

`onMethod` добавляет обработчик метода; `failNext` имитирует ошибку API.
`reset` очищает вызовы, очередь, сообщения и ошибки, сохраняя обработчики и
polling. При завершении остановите бота, дождитесь завершения `launch`, затем
закройте Nest-модуль и fake.

В `FakeTelegramApi.start({ botInfo, fallback })` можно задать данные бота и
обработчик неизвестных методов; по умолчанию такие методы завершаются ошибкой.
Поддерживаются JSON, URL-encoded и текстовые multipart-поля; содержимое файлов
не сохраняется.

Для быстрой проверки без polling задайте `bot.botInfo` и передайте raw update в
`bot.handleUpdate()`. При этом HTTP transport не проверяется. Fake реализует
только часть методов и не подтверждает работу реального Telegram и его клиентов.
