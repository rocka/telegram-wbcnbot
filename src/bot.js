'use strict';

const Telegraf = require('telegraf');

const Common = require('./common');

const bot = new Telegraf(process.env.BOT_TOKEN);

function makeTextMsg(locals) {
    if (!locals.id) {
        return [];
    }
    return [{
        type: 'article',
        id: `${locals.id}_a`,
        title: locals.title,
        input_message_content: {
            message_text: `${process.env.DOMAIN}/p/${locals.id}`
        },
        url: locals.url,
        description: locals.content
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
