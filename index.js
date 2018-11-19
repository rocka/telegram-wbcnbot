'use strict';

require('./src/web');
if (process.env.BOT_TOKEN && process.env.DOMAIN) {
    require('./src/bot');
}
