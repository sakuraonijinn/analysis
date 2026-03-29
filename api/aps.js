const crypto = require('crypto');
const https = require('https');

module.exports = async function (context, req) {
    context.log('APS data processing request');
    if (req.method === 'POST') {
        const { data, session_id, referrer } = req.body;
        const payload = decryptData(data);
        const enriched = enhanceWithML(payload, {
            ip: req.headers['x-forwarded-for'] || req.ip,
            user_agent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
            session_id,
            referrer
        });
        await Promise.all([
            processAlerts(enriched),
            storeToStorage(enriched, context)
        ]);
        context.res = { status: 200, body: { status: "processed" } };
    } else {
        context.res = { status: 405, body: "Method not allowed" };
    }
};
