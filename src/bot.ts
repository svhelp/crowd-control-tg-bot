import 'dotenv/config'
import { Telegraf } from "telegraf";
import { InlineQueryResult } from "telegraf/types";

import { CommandType } from './domain/commandTypes';
import { Team } from './domain/team';
//import "./commands/init"

const token = process.env.TELEGRAM_API_KEY ?? '';

export const bot = new Telegraf(token);

const existingTeams: Team[] = [
  {
    name: "TSM",
    members: [
      {
        name: "first"
      },
      {
        name: "second"
      },
    ]
  },
  {
    name: "GUN5",
    members: [
      {
        name: "third"
      },
      {
        name: "fourth"
      },
    ]
  },
]

bot.command(CommandType.Create, async ctx => {
  console.log(ctx)

  return await ctx.sendMessage(`Caught ${CommandType.Create} command`)
})

bot.command(CommandType.Join, async ctx => {
  console.log(ctx)

  return await ctx.sendMessage(`Caught ${CommandType.Join} command`)
})

bot.command(CommandType.Leave, async ctx => {
  console.log(ctx)

  return await ctx.sendMessage(`Caught ${CommandType.Leave} command`)
})

bot.command(CommandType.List, async ctx => {
  console.log(ctx)

  return await ctx.sendMessage(`Caught ${CommandType.List} command`)
})

bot.on("inline_query", async ctx => {
  if (!ctx.inlineQuery.query) {
    return
  }

  const teams = existingTeams
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
