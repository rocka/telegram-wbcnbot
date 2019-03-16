'use strict';

const qs = require('querystring');

const Telegraf = require('telegraf');

const Common = require('./common');

const bot = new Telegraf(process.env.BOT_TOKEN);
const rhash = process.env.IV_RHASH;

function makeTextMsg(locals) {
    if (!locals.id) {
        return [];
    }
    let url = `${process.env.DOMAIN}/p/${locals.id}`;
    if (rhash) {
        url = `https://t.me/iv?${qs.stringify({ rhash, url })}`
    }
    return [{
        type: 'article',
        id: `${locals.id}_a`,
        title: `${locals.user.name} 的微博`,
        input_message_content: {
            message_text: url,
        },
        url: locals.url,
        description: locals.content.text
    }];
}

// TODO: support more types
function makeResults(locals) {
    switch (locals.type) {
        case 'picture':
            return locals.picture.map((p, i) => {
                let r = {
                    type: 'photo',
                    id: `${locals.id}_${i}`
                };
                if (p.endsWith('.gif')) {
                    r.gif_url = p;
                    r.thumb_url = locals.picture_thumb[i];
                } else {
                    r.photo_url = p;
                    r.thumb_url = locals.picture_thumb[i];
                }
                return r;
            });
    }
}

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
    if (inlineQuery.query.length < 5) {
        console.log('[Bot Query] Skipped empty query.');
        return answerInlineQuery([]);
    }
    console.log('[Bot Query]', inlineQuery.query);
    const url = Common.getWeiboURL(inlineQuery.query);
    console.log('url:', url);
    const locals = await Common.getLocals(url);
    console.log('locals: ', locals);
    // const results = makeResults(locals);
    return answerInlineQuery(makeTextMsg(locals));
})

bot.catch((err) => {
    console.log('[ERROR]', err);
});

bot.startPolling();
console.log(`Telegram bot server running ...`);
