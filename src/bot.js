'use strict';

const qs = require('querystring');

const Pug = require('pug');
const { default: Telegraf } = require('telegraf');

const Common = require('./common');

const bot = new Telegraf(process.env.BOT_TOKEN);
const rhash = process.env.IV_RHASH;

/**
 * @param {WBCNBot.WeiboLocals} locals
 * @returns {string}
 */
function makeTextMessageContent(locals) {
    if (!locals.id) {
        return '';
    }
    let iv = `${process.env.DOMAIN}/p/${locals.id}`;
    if (rhash) {
        iv = `https://t.me/iv?${qs.stringify({ rhash, url: iv })}`
    }
    const orig = `https://m.weibo.cn/detail/${locals.mid}`;
    return Pug.renderFile('./templates/message_text.pug', { iv, orig });
}

/**
 * @param {WBCNBot.WeiboLocals} locals
 * @returns {import('telegraf/typings/telegram-types').InlineQueryResult[]}
 */
function makeInlineQueryResult(locals) {
    return [{
        type: 'article',
        id: `${locals.id}_a`,
        title: `${locals.user.name} 的微博`,
        input_message_content: {
            message_text: makeTextMessageContent(locals),
            parse_mode: 'html'
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

bot.on('inline_query', async ctx => {
    const { id, query } = ctx.inlineQuery;
    if (query.length === 0) {
        console.log('[Inline Query] empty query');
        return ctx.answerInlineQuery([], {
            switch_pm_text: 'All Systems Operational :)',
            switch_pm_parameter: `placeholder_empty_${id}`
        });
    } else if (query.length < 5) {
        console.log('[Inline Query] short query');
        return ctx.answerInlineQuery([], {
            switch_pm_text: 'Input too short ...',
            switch_pm_parameter: `placeholder_short_${id}`
        });
    }
    console.log('[Inline Query]', query);
    const url = await Common.getWeiboURL(query);
    console.log('[Inline Query] Weibo URL:', url);
    const locals = await Common.getLocals(url);
    console.log('[Inline Query] Locals:', locals);
    if (!Object.prototype.hasOwnProperty.call(locals, 'id')) {
        console.log('[Inline Query] invalid locals');
        return ctx.answerInlineQuery([], {
            switch_pm_text: 'Weibo not available :(',
            switch_pm_parameter: `placeholder_invalid_${id}`
        });
    }
    return ctx.answerInlineQuery(makeInlineQueryResult(locals));
});

bot.catch((err) => {
    console.log('[Bot ERROR]', err);
});

module.exports = bot;
