'use strict';

const qs = require('querystring');

/** @type {(url: RequestInfo, init: RequestInit?) => Promise<Response>} */
const fetch = require('node-fetch');

const WEB_ARCHIVE_ORG = 'https://web.archive.org';

function createArchive(url) {
    return fetch(`${WEB_ARCHIVE_ORG}/save/${url}`);
}

async function queryArchive(url) {
    const fields = [
        'original',
        // 'mimetype',
        'timestamp',
        'endtimestamp',
        // 'groupcount',
        'uniqcount'
    ];
    const q = qs.stringify({
        url,
        matchType: 'prefix',
        collapse: 'urlkey',
        output: 'json',
        fl: fields.join(','),
        filter: '!statuscode:[45]..',
        limit: 10,
        _: Date.now()
    });
    /** @type {string[][]} */
    const response = await fetch(`${WEB_ARCHIVE_ORG}/web/timemap/?${q}`).then(r => r.json());
    if (response.length === 0) {
        return [];
    }
    const keys = response.shift();
    return response.map(values => {
        let obj = {};
        for (let i = 0; i < keys.length; i++) {
            obj[keys[i]] = values[i];
        }
        return obj;
    })
}

async function fetchArchive(url) {
    const q = qs.stringify({
        url,
        collection: 'web',
        output: 'json'
    });
    // {"first_ts":"20200205130859","years":{"2020":[0,1,0,0,0,0,0,0,0,0,0,0]},"last_ts":"20200205130859"}
    const r1 = await fetch(`${WEB_ARCHIVE_ORG}/__wb/sparkline?${q}`).then(r => r.json());
    if (!r1.last_ts) {
        return '';
    }
    /** @type {string} */
    const r2 = await fetch(`${WEB_ARCHIVE_ORG}/web/${r1.last_ts}/${url}`).then(r => r.text());
    const begin1 = r2.indexOf('<script src="//archive.org');
    const end1 = r2.indexOf('<!-- End Wayback Rewrite JS Include -->');
    if (begin1 <= 0 && end1 <= 0) {
        return r2;
    }
    const r3 = r2.substring(0, begin1) + r2.slice(end1);
    const begin2 = r3.indexOf('<!-- BEGIN WAYBACK TOOLBAR INSERT -->');
    const end2 = r3.indexOf('<!-- END WAYBACK TOOLBAR INSERT -->');
    if (begin2 <= 0 && end2 <= 0) {
        return r3;
    }
    const r4 = r3.substring(0, begin2) + r3.slice(end2);
    return r4;
}

module.exports = {
    createArchive,
    queryArchive,
    fetchArchive
};
