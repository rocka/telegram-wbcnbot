'use strict';

const WebHookPath = process.env.WEBHOOK_PATH;
const BotToken = process.env.BOT_TOKEN;
const Domain = process.env.DOMAIN;
const Host = process.env.HOST || '127.0.0.1';
const Port = process.env.PORT || 2233;

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

const web = require('./src/web');

(async () => {

if (BotToken && Domain) {
    const bot = require('./src/bot');
    if (WebHookPath) {
        const BodyParser = require('koa-bodyparser');
        web.app.use(BodyParser());
        web.router.post(WebHookPath, async (ctx) => {
            await bot.handleUpdate(ctx.request.body, ctx.response);
            ctx.status = 200;
        })
        await bot.telegram.setWebhook(Domain + WebHookPath);
        console.log('Telegram bot running on Webhook mode ...');
        bot.telegram.getWebhookInfo().then(info => console.log('[WebhookInfo]', info));
    } else {
        await bot.telegram.deleteWebhook();
        bot.startPolling();
        console.log('Telegram bot running on polling mode ...');
    }
}

web.app.use(web.router.routes());

web.app.listen(Port, Host, () => {
    console.log(`Web server running on ${Host}:${Port} ...`);
});

})();
