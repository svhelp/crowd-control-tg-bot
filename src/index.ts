import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_API_KEY;

const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  bot.sendMessage(chatId, `Received your message: ${message}`);
});