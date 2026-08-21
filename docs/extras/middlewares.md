# Middlewares

`nestjs-telega` supports
[`telegraf-hardened`](https://github.com/telegraf-hardened/telegraf-hardened)
middleware. Middleware run in this
order: `middlewaresBefore` (or the legacy `middlewares` alias),
stage/composer handlers, update handlers, then `middlewaresAfter`.

To use an existing middleware package before handlers, add it to
`middlewaresBefore`:

```typescript
TelegrafModule.forRoot({
  middlewaresBefore: [session()],
}),
```
