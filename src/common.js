'use strict';

const VM = require('vm');
const fetch = require('node-fetch');
const Cheerio = require('cheerio');

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

function getWeiboHTML(url) {
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
            userAgent: 'Mozilla/5.0 (Android 6.0) Chrome/7.0'
        },
        document: {
            clientWidth: 42,
            documentElement: {}
        },
        parseInt: () => 42,
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

function makeLocals(url, { data, config, performance }) {
    const info = data.status.page_info || {};
    let locals = {
        url,
        id: data.status.id,
        type: info.type || 'text',
        title: `${data.status.user.screen_name} 的微博`,
        pub_time: data.status.created_at,
        username: data.status.user.screen_name,
        content: Cheerio.load(data.status.text).text()
    };
    // TODO: support type: search_topic ?
    // TODO: handle retweets
    if (data.status.pics) locals.type = 'picture';
    switch (locals.type) {
        case 'picture':
            locals.picture = data.status.pics.map(p => p.large.url);
            locals.picture_thumb = data.status.pics.map(p => p.url);
            break;
        case 'video':
            locals.video = [
                info.media_info.stream_url,
                // info.media_info.stream_url_hd
            ];
            locals.thumbnail = [info.page_pic.url];
            break;
        case 'article':
            locals.cover = [info.page_pic.url];
            break;
        default:
            break;
    }
    return locals;
}

async function getRawConfig(url) {
    const html = await getWeiboHTML(url);
    const $ = Cheerio.load(html);
    const scripts = $('script:not([src])').map((i, el) => el.firstChild.data);
    return runScripts(Array.from(scripts));
}

async function getLocals(url) {
    const config = await getRawConfig(url);
    if (config.data) {
        return makeLocals(url, config);
    }
    return {};
}

module.exports = {
    testURL,
    getWeiboURL,
    getWeiboHTML,
    runScripts,
    makeLocals,
    getRawConfig,
    getLocals
};
