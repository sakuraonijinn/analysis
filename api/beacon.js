const https = require('https');

module.exports = async function (context, req) {
    context.log('Beacon signal received');
    if (req.method === 'POST') {
        const { data } = req.body;
        await sendToMonitor(data);
        context.res = { status: 200, body: { status: "signal sent" } };
    } else {
        context.res = { status: 405, body: "Method not allowed" };
    }
};

async function sendToMonitor(data) {
    if (!process.env.DISCORD_WEBHOOK) return;
    const msg = `📡 Monitoring Alert\nIP: ${data.ip}\nUser-Agent: ${data.user_agent}\nSource: ${data.origin}\nTime: ${data.timestamp}`;
    const body = JSON.stringify({ content: msg });
    const req = https.request(process.env.DISCORD_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    req.write(body);
    req.end();
}
