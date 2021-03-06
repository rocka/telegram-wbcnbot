# telegram-wbcnbot

Generate [OGP](http://ogp.me) link preview and [Instant View](https://instantview.telegram.org/) for [Sina Weibo](https://weibo.com).

## Usage

Inline bot [@wbcnbot](https://t.me/wbcnbot) on Telegram.

![input](https://user-images.githubusercontent.com/13914967/60383676-a0879700-9aa6-11e9-99b8-f01d598f5837.png)

## Preview

### Link Preview

![Link Preview](https://user-images.githubusercontent.com/13914967/60383683-c14fec80-9aa6-11e9-8ba3-7bad5fd68f32.png)

### Instant View

![Instant View](https://user-images.githubusercontent.com/13914967/60383965-0d049500-9aab-11e9-8753-7e9eab41b894.png)

## Deploy

### Requirements

- A public server
- A domain points to the server

### Steps

1. Clone the repo, and install dependencies by `npm ci`.
1. Setup necessary [environment variables](#environment-variables), then run this bot by `node idnex.js`.
1. Create a bot following instructions given by [@BotFather](https://t.me/botfather), and enable [Inline Mode](https://core.telegram.org/bots/inline) for this bot.
1. Submit [this](./rules.instantview) as Instant View template of your domain [here](https://instantview.telegram.org/my/), to get your `iv_hash`

### Environment variables

- `WEBHOOK_PATH` Optional. Use [Webhook](https://core.telegram.org/bots/webhooks) instead of long polling for receiving updates. See [here](https://core.telegram.org/bots/api#getting-updates) for more info.
- `BOT_TOKEN` Telegram bot token from [@BotFather](https://t.me/botfather).
- `IV_RHASH` Instant view template hash.
- `DOMAIN` Domain for webpage serving.
- `HOST` and `PORT` Host and port to listen. Default to `127.0.0.1:2233`.
