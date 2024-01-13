import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_API_KEY ?? '';
const webhookAddress = process.env.WEBHOOK_ADDRESS ?? '';

const botOptions: TelegramBot.ConstructorOptions = webhookAddress
  ? undefined
  : { polling: true }

export const bot = new TelegramBot(token, botOptions);

if (webhookAddress) {
  bot.setWebHook(webhookAddress)
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  bot.sendMessage(chatId, `Received your message: ${message}`);
});
