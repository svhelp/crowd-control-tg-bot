import 'dotenv/config'
import { message } from "telegraf/filters"
import { Telegraf } from "telegraf";

const token = process.env.TELEGRAM_API_KEY ?? '';

export const bot = new Telegraf(token);

bot.on(message('text'), ctx => {
  ctx.sendMessage(`I've got your message: "${ctx.update.message.text}". Please send me another one!`)
});
