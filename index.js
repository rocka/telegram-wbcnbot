'use strict';

const VM = require('vm');
const Pug = require('pug');
const Koa = require('koa');
const Router = require('koa-router');
const Cheerio = require('cheerio');
const fetch = require('node-fetch');

const server = new Koa();
const router = new Router();

function testURL(url) {
    if (url.startsWith('https://m.weibo.cn/')
        || url.startsWith('m.weibo.cn/')
        || url.startsWith('http://m.weibo.cn/')
        || url.startsWith('https://weibo.com/')
        || url.startsWith('weibo.com/')
        || url.startsWith('http://weibo.com/')) {
        return true
    }
    return false;
}

function getWeiboURL(id) {
    if (testURL(id)) {
        return id;
    }
    return `https://m.weibo.cn/detail/${id}`;
}

function getWeiboHtml(url) {
    return fetch(url, {
        headers: {
            'Accept-Encoding': 'gzip',
            'User-Agent': 'Mozilla/5.0 (Android 6.0) Chrome/7.0'
        }
    }).then(r => r.text());
}

function runScripts(scripts) {
    const sandbox = VM.createContext({
        navigator: {
            userAgent: 'Mozilla/5.0'
        },
        document: {
            clientWidth: 1230,
            documentElement: {}
        },
        parseInt: Number.parseInt,
        window: null,
        config: null,
        $render_data: null,
        __wb_performance_data: null
    });
    scripts.forEach(s => {
        VM.runInContext(s, sandbox);
    });
    return {
        data: sandbox.$render_data,
        config: sandbox.config,
        performance: sandbox.__wb_performance_data
    };
}

function renderOgp(url, { data, config, performance }, keep) {
    const info = data.status.page_info || { type: 'text' };
    let locals = {
        url,
        keep,
        title: `${data.status.user.screen_name} 的微博`,
        pub_time: data.status.created_at,
        username: data.status.user.screen_name,
        content: Cheerio.load(data.status.text).text()
    };
    if (data.status.pics) info.type = 'picture';
    // TODO: support type: search_topic ?
    switch (info.type) {
        case 'picture':
            locals.picture = data.status.pics.map(p => p.large.url);
            return Pug.renderFile('./templates/picture.pug', locals);
        case 'text':
            return Pug.renderFile('./templates/text.pug', locals);
        case 'video':
            locals.video = [
                info.media_info.stream_url,
                // info.media_info.stream_url_hd
            ];
            locals.thumbnail = [info.page_pic.url];
            return Pug.renderFile('./templates/video.pug', locals);
        case 'article':
            locals.cover = [info.page_pic.url];
            return Pug.renderFile('./templates/article.pug', locals);
        default:
            return Pug.renderFile('./templates/text.pug', locals);
    }
}

router.get('/p/:id', async (ctx) => {
    const url = getWeiboURL(ctx.params.id);
    const keep = Reflect.has(ctx.query, 'k');
    const html = await getWeiboHtml(url);
    const $ = Cheerio.load(html);
    const scripts = $('script:not([src])');
    const config = runScripts(Array.from(scripts.map((i, el) => el.firstChild.data)));
    ctx.body = renderOgp(url, config, keep);
});

router.get('/json/:id', async (ctx) => {
    const url = getWeiboURL(ctx.params.id);
    const html = await getWeiboHtml(url);
    const $ = Cheerio.load(html);
    const scripts = $('script:not([src])');
    const config = runScripts(Array.from(scripts.map((i, el) => el.firstChild.data)));
    ctx.body = config;
});

server.use(router.routes());
server.listen(process.env.PORT || 2233, '127.0.0.1');
