'use strict';

const Pug = require('pug');
const Koa = require('koa');
const Router = require('koa-router');

const Common = require('./common');

const server = new Koa();
const router = new Router();

router.get('/p/:id', async (ctx) => {
    const { id } = ctx.params;
    // use query param '?k' to prevent redirection
    const keep = Reflect.has(ctx.query, 'k');
    const url = Common.getWeiboURL(id);
    const locals = await Common.getLocals(url);
    if (keep) {
        locals.keep = keep;
    }
    ctx.body = Pug.renderFile(`./templates/${locals.type}.pug`, locals);
});

router.get('/json/:id', async (ctx) => {
    const { id } = ctx.params;
    // use query param '?raw' to prevent redirection
    const raw = Reflect.has(ctx.query, 'raw');
    const url = Common.getWeiboURL(id);
    if (raw) {
        ctx.body = await Common.getRawConfig(url);
        return;
    }
    ctx.body = await Common.getLocals(url);
});

server.use(router.routes());
const port = process.env.PORT || 2233;
server.listen(port, '127.0.0.1', () => {
    console.log(`Web server running on 127.0.0.1:${port} ...`);
});
