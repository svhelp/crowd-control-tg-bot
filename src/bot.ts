import { Format, Telegraf } from "telegraf";
import { InlineQueryResult } from "telegraf/types";

import { CommandType } from './commands/commandTypes';
import { createTeam, getChatTeams, getTeamMembers, getUserTeams, joinTeam, leaveTeam } from "./db-service";
import { illegalInvokerException, illegalSourceException } from "./localization/exceptions";

const { bold, fmt, mention, join } = Format

const token = process.env.TELEGRAM_API_KEY ?? '';

export const bot = new Telegraf(token);

bot.command(CommandType.Create, async ctx => {
  const { message } = ctx.update

  if (message.chat.type === "private") {
    return illegalSourceException
  }

  const result = await createTeam(message.from.id.toString(), message.chat.id.toString(), ctx.payload)

  return await ctx.sendMessage(result)
})

bot.command(CommandType.Join, async ctx => {
  const { message } = ctx.update

  if (message.chat.type === "private") {
    return illegalSourceException
  }

  const result = await joinTeam(message.from.id.toString(), message.chat.id.toString(), ctx.payload)

  return await ctx.sendMessage(result)
})

bot.command(CommandType.Leave, async ctx => {
  const { message } = ctx.update

  if (message.chat.type === "private") {
    return illegalSourceException
  }

  const result = await leaveTeam(message.from.id.toString(), message.chat.id.toString(), ctx.payload)

  return await ctx.sendMessage(result)
})

bot.command(CommandType.List, async ctx => {
  const { message } = ctx.update

  if (message.chat.type === "private") {
    return illegalSourceException
  }

  const chatTeams = await getChatTeams(message.chat.id.toString())
  const chatTeamsDescription = chatTeams.map(t => {
    const mentions = t.members.map((m, index) => mention(index.toString(), parseInt(m.userId)))
    const teamName = fmt`${bold(t.name)}: ${join(mentions, ', ')}`

    return teamName
  })

  const formattedText = join(chatTeamsDescription, '\n')

  return await ctx.sendMessage(formattedText, { disable_notification: true })
})

bot.command(CommandType.Notify, async ctx => {
  const { message } = ctx.update

  if (!message.via_bot || message.via_bot.id !== ctx.botInfo.id) {
    return await ctx.sendMessage(illegalInvokerException)
  }

  const members = await getTeamMembers(message.chat.id.toString(), ctx.payload.split("\n")[0])
  const mentions = members.map(m => mention('.', parseInt(m)))
  
  const formattedText = fmt`Hey hey hey\n${join(mentions)}`
  
  return await ctx.sendMessage(formattedText)
})

bot.on("inline_query", async ctx => {
  if (!ctx.inlineQuery.query) {
    return
  }

  console.log(ctx.inlineQuery)

  const existingTeams = await getUserTeams(ctx.inlineQuery.from.id.toString())

  const teams = existingTeams
    .map(
      (team): InlineQueryResult => {
        const message = `/${CommandType.Notify}@${ctx.botInfo.username} ${team.name}\n${ctx.inlineQuery.query}`

        return {
          type: "article",
          id: team.name,
          title: team.name,
          description: '',
          input_message_content: {
            message_text: message
          },
        }
      },
    );

  return await ctx.answerInlineQuery(teams);
});
