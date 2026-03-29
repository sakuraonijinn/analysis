const crypto = require('crypto');
const https = require('https');

module.exports = async function (context, req) {
    context.log('Analytics processing request');
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID'
            }
        };
        return;
    }

    try {
        const { encrypted_payload, session_id, origin } = req.body;
        if (!encrypted_payload) {
            context.res = { status: 400, body: "Missing payload" };
            return;
        }

        // 🧬 Decrypt RSA-OAEP
        const decrypted = crypto.privateDecrypt({
            key: PRIVATE_KEY_PEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        }, Buffer.from(encrypted_payload, 'base64'));

        const payload = JSON.parse(decrypted.toString('utf8'));

        // 🔍 Enrich data
        const enriched = {
            ...payload,
            ip: req.headers['x-forwarded-for'] || req.ip,
            user_agent: req.headers['user-agent'],
            timestamp: new Date().toISOString(),
            session_id,
            origin
        };

        // 🚀 Parallel Processing
        await Promise.all([
            processAlerts(enriched),
            storeToStorage(enriched, context)
        ]);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: { status: "processed" }
        };
    } catch (err) {
        context.log.error('Analytics processing error:', err);
        context.res = { status: 500, body: "Processing error" };
    }
};

// 📱 Alerts System
async function processAlerts(data) {
    if ((data.amount || 0) < 100) return;
    const msg = `🔄 High Value Update\nSource: ${data.source || 'Unknown'}\nAmount: $${data.amount || 'N/A'}\nReference: ${data.reference || 'N/A'}\nTime: ${data.timestamp}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML' });

    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// 💾 Storage System
async function storeToStorage(data, context) {
    const { TableClient } = require("@azure/data-tables");
    const client = TableClient.fromConnectionString(AZURE_STORAGE_CONN, "analytics_logs");
    const entity = {
        partitionKey: data.source?.substring(0, 3) || 'gen',
        rowKey: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        card: undefined
    };
    await client.createEntity(entity);
}
