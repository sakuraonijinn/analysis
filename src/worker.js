name = "data-processor"
main = "src/worker.js"
compatibility_date = "2023-12-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "data-processor-prod"
zone_name = "v3accntc2.com"
routes = [
  "api.v3accntc2.com/*",
  "webhooks.v3accntc2.com/*"
]

[vars]
# Environment variables
NODE_ENV = "production"
LOG_LEVEL = "info"

# Webhook endpoints (comma separated)
WEBHOOK_URLS = "https://azure1.azurewebsites.net/webhook,https://azure2.azurewebsites.net/webhook"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-id"

[[unsafe.bindings]]
name = "PRIVATE_KEY_PEM"
type = "secret"

[[unsafe.bindings]]
name = "TELEGRAM_BOT_TOKEN"
type = "secret"

[[unsafe.bindings]]
name = "TELEGRAM_CHAT_ID"
type = "secret"

[[unsafe.bindings]]
name = "BIGQUERY_TOKEN"
type = "secret"

[[unsafe.bindings]]
name = "BIGQUERY_ENDPOINT"
type = "secret"

[triggers]
crons = ["0 */6 * * *"]  # Run every 6 hours for cleanup

[site]
bucket = "./public"
