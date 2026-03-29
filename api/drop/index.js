const crypto = require('crypto');
const https = require('https');

// 🔐 Load environment variables (SWA will inject them)
const PRIVATE_KEY_PEM = process.env.PRIVATE_KEY_PEM;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const AZURE_STORAGE_CONN = process.env.AZURE_STORAGE_CONNECTION;

// 🔥 Main handler (routes /api requests to specific endpoints)
module.exports = async function (context, req) {
    context.log('Analytics request received');
    const route = req.path;

    if (route === '/drop' && req.method === 'POST') {
        return require('./drop')(context, req);
    } else if (route === '/beacon' && req.method === 'POST') {
        return require('./beacon')(context, req);
    } else if (route === '/aps' && req.method === 'POST') {
        return require('./aps')(context, req);
    } else {
        context.res = { status: 404, body: "Endpoint not found" };
    }
};
