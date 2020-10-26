'use strict';

const Pug = require('pug');
const Koa = require('koa');
const Router = require('koa-router');

const Common = require('./common');

const app = new Koa();
const router = new Router();

router.get('/p/:id', async (ctx) => {
    const { id } = ctx.params;
    const url = await Common.getWeiboURL(id);
    const locals = await Common.getLocals(url);
    if (Object.prototype.hasOwnProperty.call(ctx.query, 'k')) {
        // use query param '?k' to prevent redirection
        locals.keep = true;
    }
    if (!Object.prototype.hasOwnProperty.call(locals, 'id')) {
        ctx.status = 404;
        return ctx.body = 'Weibo not available :(';
    }
    ctx.body = Pug.renderFile('./templates/detail_page.pug', locals);
});

router.get('/json/:id', async (ctx) => {
    const { id } = ctx.params;
    const url = await Common.getWeiboURL(id);
    if (Object.prototype.hasOwnProperty.call(ctx.query, 'raw')) {
        // use query param '?raw' to prevent redirection
        ctx.body = await Common.getRawConfig(url);
        return;
    }
    ctx.body = await Common.getLocals(url);
});

module.exports = { app, router };
