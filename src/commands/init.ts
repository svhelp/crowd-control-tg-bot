import { Telegraf } from "telegraf";
import { commands } from "./commands";

const token = process.env.TELEGRAM_API_KEY ?? '';

export const initTgCommands = async () => {
  const bot = new Telegraf(token);
  
  const commandList = Object.keys(commands).map(c => (
      {
        command: c,
        description: commands[c]
      }
    )
  )
  
  await bot.telegram.setMyCommands(commandList)
}
