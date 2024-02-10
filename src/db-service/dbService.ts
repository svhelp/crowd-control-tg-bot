import { createKysely } from "@vercel/postgres-kysely";
import { Database } from "domain/db/database";

const MAX_TEAMS = 10

const db = createKysely<Database>();

export const createTeam = async (creatorId: string, chatId: string, name: string) => {
  const existingTeam = await db.selectFrom('team')
    .select('id')
    .where('chatId', '=', chatId)
    .where('name', '=', name)
    .executeTakeFirst()

  if (existingTeam) {
    return 'Команда с таким названием уже существует в чате.'
  }

  const currentTeams = await db.selectFrom('teamMemberRelation')
    .select('id')
    .where('userId', '=', creatorId)
    .execute()

  if (currentTeams.length >= MAX_TEAMS) {
    return 'Вы уже состоите в максимально доступном числе команд.'
  }

  const [ { id: teamId } ] = await db.insertInto('team')
    .values({name, chatId, creatorId})
    .returning(['id'])
    .execute()

  await db.insertInto('teamMemberRelation')
    .values({userId: creatorId, teamId})
    .execute()
    
    return 'Команда успешно создана.'
}

export const joinTeam = async (userId: string, chatId: string, name: string) => {
  const team = await db.selectFrom('team')
    .select('id')
    .where('chatId', '=', chatId)
    .where('name', '=', name)
    .executeTakeFirst()

  if (!team) {
    return 'Команды с таким названием не существует в чате.'
  }

  const currentTeams = await db.selectFrom('teamMemberRelation')
    .select('id')
    .where('userId', '=', userId)
    .execute()

  if (currentTeams.length >= MAX_TEAMS) {
    return 'Вы уже состоите в максимально доступном числе команд.'
  }

  await db.insertInto('teamMemberRelation')
    .values({userId, teamId: team.id})
    .execute()
    
    return 'Вы успешно вступили в команду.'
}

export const leaveTeam = async (userId: string, chatId: string, name: string) => {
  const team = await db.selectFrom('team')
    .select('id')
    .where('chatId', '=', chatId)
    .where('name', '=', name)
    .executeTakeFirst()

  if (!team) {
    return 'Команды с таким названием не существует в чате.'
  }

  const removedRelation = await db.deleteFrom('teamMemberRelation')
    .where('teamId', '=', team.id)
    .where('userId', '=', userId)
    .returning('id')
    .execute()
    
    return removedRelation.length === 0
      ? 'Вы не состоите в данной команде.'
      : 'Вы успешно покинули команду.'
}

export const getUserTeams = async (userId: string) => {
  return await db.selectFrom('teamMemberRelation')
    .where('userId', '=', userId)
    .innerJoin('team', 'team.id', 'teamMemberRelation.teamId')
    .execute()
}

export const getChatTeams = async (chatId: string) => {
  return await db.selectFrom('team')
    .where('chatId', '=', chatId)
    .innerJoin('teamMemberRelation', 'teamMemberRelation.teamId', 'team.id')
    .execute()
}