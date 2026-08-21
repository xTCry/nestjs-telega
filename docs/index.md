# Installation

> This documentation currently describes the stable
> [Telegraf](https://github.com/telegraf/telegraf)-based release line. It is
> maintained in the [telegraf branch](https://github.com/xTCry/nestjs-telega/tree/telegraf)
> and published with the npm dist-tag `telegraf`. The next default line, now in
> development on `main`, will use
> [telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened).

```bash
$ npm i nestjs-telega@telegraf telegraf
```

Use the explicit `@telegraf` tag until the first stable
`telegraf-hardened` release becomes the npm `latest` channel.

Once the installation process is complete, we can import the `TelegrafModule` into the root `AppModule`.

```typescript title="src/app.module.ts"
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telega';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: 'TELEGRAM_BOT_TOKEN',
    })
  ],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as Telegraf class constructor from the Telegraf package, as described [here](https://telegraf.js.org/#/?id=constructor).
