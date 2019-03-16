'use strict';

const VM = require('vm');
const fetch = require('node-fetch');
const Cheerio = require('cheerio');

const WeiboURL = [
    'https://m.weibo.cn/',
    'm.weibo.cn/',
    'http://m.weibo.cn/',
    'https://weibo.com/',
    'weibo.com/',
    'http://weibo.com/'
];

/**
 * @param {string} id
 */
function getWeiboURL(id) {
    if (WeiboURL.some(u => id.startsWith(u))) {
        return id;
    }
    return `https://m.weibo.cn/detail/${id}`;
}

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
function getWeiboHTML(url) {
    return fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Android 6.0) Chrome/7.0'
        },
        compress: true
    }).then(r => r.text());
}

/**
 * @param {string[]} scripts 
 */
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

function getTweetStatus(status) {
    let text, html;
    if (status.isLongText) {
        text = status.longText.longTextContent;
        html = status.longText.longTextContent;
        status.longText.url_objects.forEach(o => {
            text = text.replace(o.url_ori, o.info.url_long);
            html = html.replace(o.url_ori, `<a href="${o.info.url_long}">${o.info.url_long}</a>`);
        });
        html = html.replace(/\n/g, '<br>');
    } else {
        const $ = Cheerio.load(status.text);
        text = $('body').text();
        $('span.url-icon').each((i, e) => {
            const s = $(e);
            s.replaceWith(s.children().attr('alt'));
        });
        $('a').each((i, e) => {
            const a = $(e);
            if (a.text() === '网页链接') {
                a.replaceWith(`<a href="${a.attr('href')}">${a.attr('href')}</a>`);
            } else if (a.text() === '查看图片') {
                a.replaceWith(`<img src="${a.attr('href')}"/>`);
            }
        });
        html = $('body').html();
    }
    let type = status.page_info ? status.page_info.type : 'text';
    if (status.pic_ids && status.pic_ids.length > 0) type = 'picture';
    const result = {
        id: status.id,
        mid: status.mid,
        type,
        user: {
            id: status.user.id,
            name: status.user.screen_name,
            avatar: status.user.profile_image_url
        },
        time: status.created_at,
        content: { html, text }
    };
    // TODO: support type: search_topic ?
    switch (type) {
        case 'picture':
            result.picture = (status.pics || []).map(p => p.large.url);
            break;
        case 'video':
            result.video = [status.page_info.media_info.stream_url];
            result.thumbnail = [status.page_info.page_pic.url];
            break;
        case 'article':
            result.cover = [status.page_info.page_pic.url];
            break;
    }
    return result;
}

function makeLocals(url, { data, config, performance }) {
    let locals = getTweetStatus(data.status);
    locals.url = url;
    if (data.status.retweeted_status) {
        locals.retweet = getTweetStatus(data.status.retweeted_status);
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
    getWeiboURL,
    getWeiboHTML,
    runScripts,
    makeLocals,
    getRawConfig,
    getLocals
};
