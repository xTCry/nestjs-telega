# Testing Telegram bots

`nestjs-telega/testing` provides `FakeTelegramApi`, a local, extensible subset
of the Bot API for testing Nest handlers and real Telegraf polling without
contacting Telegram. See the executable [polling example](../sample/01-complete-app/src/testing/polling.spec.ts).

Start the fake, configure `options.telegram.apiRoot` to `api.url` and set
`launchOptions: false`. After Nest initialization, retrieve the bot and start
`bot.launch()`; wait for `api.waitForPolling()`, then send an update with
`api.pushText(user, text)`, `api.pushCallback(user, data, message)`, or
`api.pushUpdate(update)`. Use `api.waitForCall(method, predicate)` or
`api.waitForNextCall(index, method, predicate)` to inspect calls and results.
The sample also tests its actual keyboard callbacks and wizard sessions for two
users. Its rich-message test shows how to supply a custom `sendRichMessage`
response; the fake does not validate Telegram's rich-message rendering.

Use `api.onMethod(method, handler)` to implement a missing method, and
`api.failNext(method, error)` to simulate an API error. `api.reset()` clears
recorded calls, queued updates, messages and failures; registered methods and
the running polling loop remain. Stop the bot, await its launch promise, close
the Nest module, then close the fake in cleanup.

`FakeTelegramApi.start({ botInfo, fallback })` accepts custom bot identity and
an optional fallback for methods without built-in handlers. The default is to
reject unsupported methods. Requests support JSON, URL-encoded fields and
multipart text fields; uploaded file contents are not retained.

For faster handler tests, disable auto-launch, set `bot.botInfo`, and pass a raw
update directly to `await bot.handleUpdate(update)`. This bypasses polling and
does not test the HTTP transport. Neither approach proves real Telegram API
behaviour, permissions or client rendering. The fake intentionally implements
only a subset of methods and rejects unsupported methods.
