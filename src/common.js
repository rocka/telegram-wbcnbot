'use strict';

const vm = require('vm');
const { URL } = require('url');

/** @type {(url: RequestInfo, init: RequestInit?) => Promise<Response>} */
const fetch = require('node-fetch');
const Cheerio = require('cheerio');

const Archive = require('./archive');

const WeiboURL = [
    'https://m.weibo.cn/',
    'm.weibo.cn/',
    'http://m.weibo.cn/',
    'https://weibo.com/',
    'weibo.com/',
    'http://weibo.com/'
];

const WeiboIntlShareURL = [
    'https://weibointl.api.weibo.cn/share/',
    'weibointl.api.weibo.cn/share/',
    'http://weibointl.api.weibo.cn/share/'
];

async function getWeiboIdFromIntlShare(url) {
    const html = await getWeiboHTML(url);
    const $ = Cheerio.load(html);
    const onclick = $('.footer_suspension .m-btn-orange')
        .first()
        .attr('onclick');
    const id = onclick.match(/forward\(\d+,(?<id>\d+)\)/).groups['id'];
    return id;
}

/**
 * @param {string} str
 */
async function getWeiboURL(str) {
    if (WeiboURL.some(u => str.startsWith(u))) {
        return str;
    }
    let id = str;
    if (WeiboIntlShareURL.some(u => str.startsWith(u))) {
        const u = new URL(str);
        if (u.searchParams.has('weibo_id')) {
            id = u.searchParams.get('weibo_id');
        } else {
            id = await getWeiboIdFromIntlShare(str);
        }
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
            'User-Agent': 'Mozilla/5.0 (Android 6.0) Chrome/7.0 Safari/8.0'
        },
        compress: true
    }).then(r => {
        if (r.status === 200) {
            Archive.queryArchive(url).then(archives => {
                if (archives.length === 0) {
                    Archive.createArchive(url);
                }
            })
            return r.text();
        }
        return Archive.fetchArchive(url);
    })
}

/**
 * @param {string[]} scripts
 * @returns {WBCNBot.PageGlobals}
 */
function runScripts(scripts) {
    const sandbox = vm.createContext({
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
    for (const s of scripts) {
        vm.runInContext(s, sandbox);
    }
    return {
        data: sandbox.$render_data,
        config: sandbox.config,
        performance: sandbox.__wb_performance_data
    };
}

/**
 * @param {WBCNBot.WeiboStatus} status
 * @returns {WBCNBot.WeiboLocals}
 */
function getTweetStatus(status) {
    let text, html;
    if (status.isLongText && status.longText) {
        text = status.longText.longTextContent;
        html = text;
        for (const o of status.longText.url_objects) {
            if (!o.info) continue;
            text = text.replace(o.url_ori, o.info.url_long);
            html = html.replace(o.url_ori, `<a href="${o.info.url_long}">${o.info.url_long}</a>`);
        }
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
            switch (a.text()) {
                case '网页链接':
                    a.replaceWith(`<a href="${a.attr('href')}">${a.attr('href')}</a>`);
                    break;
                case '查看图片':
                case '评论配图':
                    a.replaceWith(`<img src="${a.attr('href')}"/>`);
                    break;
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
            const mi = status.page_info.media_info;
            /** @type {string[]} */
            const urls = [
                mi.stream_url,
                mi.stream_url_hd,
                Object.values(status.page_info.urls)
            ];
            result.video = [urls.find(i => i.includes('.weibocdn.com') && i.includes('.mp4'))];
            result.thumbnail = [status.page_info.page_pic.url];
            break;
        case 'article':
            result.cover = [status.page_info.page_pic.url];
            break;
    }
    return result;
}

/**
 * @param {string} url
 * @param {WBCNBot.PageGlobals} globals
 * @returns {WBCNBot.WeiboLocals}
 */
function makeLocals(url, { data }) {
    let locals = getTweetStatus(data.status);
    locals.url = url;
    if (data.status.retweeted_status) {
        locals.retweet = getTweetStatus(data.status.retweeted_status);
    }
    return locals;
}

/**
 * @param {string} url
 * @returns {WBCNBot.PageGlobals}
 */
async function getRawConfig(url) {
    const html = await getWeiboHTML(url);
    const $ = Cheerio.load(html);
    const scripts = $('script:not([src])').map((i, el) => el.firstChild.data);
    return runScripts(Array.from(scripts));
}

/**
 * @param {string} url
 * @returns {WBCNBot.WeiboLocals}
 */
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
