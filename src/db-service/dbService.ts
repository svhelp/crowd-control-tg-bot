import { createKysely } from "@vercel/postgres-kysely";
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import { Database } from "db/database";
import { Team } from "domain/team";
import { NamedModel } from "domain/namedModel";

const MAX_TEAMS = 10

const db = createKysely<Database>();

export const createTeam = async (creatorId: string, chatId: string, name: string) => {
  if (name) {
    return 'Необходимо ввести название команды.'
  }

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
  if (name) {
    return 'Необходимо ввести название команды.'
  }

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
  if (name) {
    return 'Необходимо ввести название команды.'
  }
  
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

export const getTeamMembers = async (chatId: string, name: string) => {
  const team = await db.selectFrom('team')
    .select('id')
    .where('name', '=', name)
    .where('chatId', '=', chatId)
    .executeTakeFirst()

  const data = await db.selectFrom('teamMemberRelation')
    .select('userId')
    .where('teamId', '=', team.id)
    .execute()

  return data.map(x => x.userId)
}

export const getUserTeams = async (userId: string) => {
  const teams = await db.selectFrom('teamMemberRelation')
    .select('teamId')
    .where('userId', '=', userId)
    .distinct()
    .execute()

  if (teams.length === 0) {
    return []
  }

  const data: NamedModel[] = await db.selectFrom('team')
    .select('name')
    .where('id', 'in', teams.map(t => t.teamId))
    .execute()

  return data
}

export const getChatTeams = async (chatId: string) => {
  const data: Team[] = await db.selectFrom('team')
    .select((eb) => [
      'name',
      jsonArrayFrom(
        eb.selectFrom('teamMemberRelation')
          .select(['userId'])
          .whereRef('teamMemberRelation.teamId', '=', 'team.id')
          .limit(10)
      ).as('members')
    ])
    .where('chatId', '=', chatId)
    .execute()

  return data
}