import { bot } from '../src/bot';

const webhookDomain = process.env.WEBHOOK_DOMAIN ?? '';
const webhookPath = process.env.WEBHOOK_PATH ?? '';

if (!webhookDomain) {
  throw new Error("Initialization error. Webhook domain config is missing.");
}

export default bot.createWebhook({
  domain: webhookDomain,
  path: webhookPath,
});
