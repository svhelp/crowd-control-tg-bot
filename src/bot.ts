import { Telegraf } from "telegraf";
import { InlineQueryResult } from "telegraf/types";

import { CommandType } from './domain/commandTypes';
import { Team } from './domain/team';
import { createTeam, getChatTeams, joinTeam, leaveTeam } from "./db-service/dbService";

const token = process.env.TELEGRAM_API_KEY ?? '';

export const bot = new Telegraf(token);

bot.command(CommandType.Create, async ctx => {
  const { message } = ctx.update

  const result = await createTeam(message.from.id.toString(), message.chat.id.toString(), ctx.payload)

  return await ctx.sendMessage(result)
})

bot.command(CommandType.Join, async ctx => {
  const { message } = ctx.update

  const result = await joinTeam(message.from.id.toString(), message.chat.id.toString(), ctx.payload)

  return await ctx.sendMessage(result)
})

bot.command(CommandType.Leave, async ctx => {
  const { message } = ctx.update

  const result = await leaveTeam(message.from.id.toString(), message.chat.id.toString(), ctx.payload)

  return await ctx.sendMessage(result)
})

bot.command(CommandType.List, async ctx => {
  const { message } = ctx.update

  const result = await getChatTeams(message.chat.id.toString())

  return await ctx.sendMessage(result.toString())
})

bot.on("inline_query", async ctx => {
  if (!ctx.inlineQuery.query) {
    return
  }

  console.log(ctx)

  //const existingTeams = await getUserTeams(ctx.chat)

  const teams = ([] as Team[])
    .map(
      (team): InlineQueryResult => {
        const members = team.members.map(m => `@${m.name}`).join(", ")

        return {
          type: "article",
          id: team.name,
          title: team.name,
          description: members,
          input_message_content: {
            message_text: `${members} ${ctx.inlineQuery.query}`,
          },
        }
      },
    );

  return await ctx.answerInlineQuery(teams);
});
