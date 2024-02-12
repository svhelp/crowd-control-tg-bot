import { createKysely } from "@vercel/postgres-kysely";
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import { Database } from "db/database";
import { Team } from "domain/team";
import { NamedModel } from "domain/namedModel";
import { teamNameMissingException, teamAlreadyExistsException, maxTeamsReachedException, teamDoesNotExistException } from "localization/exceptions";
import { teamCreatedSuccessfuly, teamJoinedSuccessfuly, teamLeftNevertheless, teamLeftSuccessfuly } from "localization/results";

const MAX_TEAMS = 10

const db = createKysely<Database>();

const getTeamId = async (chatId: string, name: string) => {
  return await db.selectFrom('team')
    .select('id')
    .where('chatId', '=', chatId)
    .where('name', '=', name)
    .executeTakeFirst()
}

const verifyMaxTeams = async (userId: string) => {
  const currentTeams = await db.selectFrom('teamMemberRelation')
    .select('id')
    .where('userId', '=', userId)
    .execute()

  return currentTeams.length < MAX_TEAMS
}

export const createTeam = async (creatorId: string, chatId: string, name: string) => {
  if (!name) {
    return teamNameMissingException
  }

  const existingTeam = await getTeamId(chatId, name)

  if (existingTeam) {
    return teamAlreadyExistsException
  }

  const maxTeamsNotReached = await verifyMaxTeams(creatorId)

  if (!maxTeamsNotReached) {
    return maxTeamsReachedException
  }

  const [ { id: teamId } ] = await db.insertInto('team')
    .values({name, chatId, creatorId})
    .returning(['id'])
    .execute()

  await db.insertInto('teamMemberRelation')
    .values({userId: creatorId, teamId})
    .execute()
    
  return teamCreatedSuccessfuly
}

export const joinTeam = async (userId: string, chatId: string, name: string) => {
  if (!name) {
    return teamNameMissingException
  }

  const team = await getTeamId(chatId, name)

  if (!team) {
    return teamDoesNotExistException
  }

  const maxTeamsNotReached = await verifyMaxTeams(userId)

  if (!maxTeamsNotReached) {
    return maxTeamsReachedException
  }

  await db.insertInto('teamMemberRelation')
    .values({userId, teamId: team.id})
    .execute()
    
  return teamJoinedSuccessfuly
}

export const leaveTeam = async (userId: string, chatId: string, name: string) => {
  if (!name) {
    return teamNameMissingException
  }
  
  const team = await getTeamId(chatId, name)

  if (!team) {
    return teamDoesNotExistException
  }

  const removedRelation = await db.deleteFrom('teamMemberRelation')
    .where('teamId', '=', team.id)
    .where('userId', '=', userId)
    .returning('id')
    .execute()
    
  return removedRelation.length === 0
    ? teamLeftNevertheless
    : teamLeftSuccessfuly
}

export const getTeamMembers = async (chatId: string, name: string) => {
  const team = await getTeamId(chatId, name)

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
