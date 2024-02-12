import { createKysely } from "@vercel/postgres-kysely";
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres'
import { Database } from "db/database";
import { Team } from "domain/team";
import { NamedModel } from "domain/namedModel";
import { teamNameMissingException, teamAlreadyExistsException, maxTeamsReachedException, teamDoesNotExistException, alreadyAMemberException } from "../localization/exceptions";
import { teamCreatedSuccessfuly, teamJoinedSuccessfuly, teamLeftNevertheless, teamLeftSuccessfuly } from "../localization/results";
import { User } from "telegraf/types";

const MAX_TEAMS = 10

const db = createKysely<Database>()

const getTeamId = async (chatId: number, name: string) => {
  return await db.selectFrom('team')
    .select('id')
    .where('chatId', '=', chatId)
    .where('name', '=', name)
    .executeTakeFirst()
}

const verifyMaxTeams = async (userId: number) => {
  const currentTeams = await db.selectFrom('teamMemberRelation')
    .select('id')
    .where('userId', '=', userId)
    .execute()

  return currentTeams.length < MAX_TEAMS
}

const saveUserIfNotExists = async (user: User) => {
  const existingUser = await db.selectFrom('user')
    .select('id')
    .where('id', '=', user.id)
    .executeTakeFirst()

  if (existingUser) {
    return
  }

  await db.insertInto('user')
    .values({
      id: user.id,
      name: user.first_name,
      username: user.username
    })
    .execute()
}

export const createTeam = async (creator: User, chatId: number, name: string) => {
  if (!name) {
    return teamNameMissingException
  }

  const existingTeam = await getTeamId(chatId, name)

  if (existingTeam) {
    return teamAlreadyExistsException
  }

  const maxTeamsNotReached = await verifyMaxTeams(creator.id)

  if (!maxTeamsNotReached) {
    return maxTeamsReachedException
  }

  saveUserIfNotExists(creator)

  const [ { id: teamId } ] = await db.insertInto('team')
    .values({name, chatId, creatorId: creator.id})
    .returning(['id'])
    .execute()

  await db.insertInto('teamMemberRelation')
    .values({userId: creator.id, teamId})
    .execute()

  return teamCreatedSuccessfuly
}

export const joinTeam = async (user: User, chatId: number, name: string) => {
  if (!name) {
    return teamNameMissingException
  }

  const team = await getTeamId(chatId, name)

  if (!team) {
    return teamDoesNotExistException
  }

  const maxTeamsNotReached = await verifyMaxTeams(user.id)

  if (!maxTeamsNotReached) {
    return maxTeamsReachedException
  }

  const existingRelation = await db.selectFrom('teamMemberRelation')
    .select('id')
    .where('teamId', '=', team.id)
    .where('userId', '=', user.id)
    .execute()

  if (existingRelation.length > 0) {
    return alreadyAMemberException
  }

  saveUserIfNotExists(user)

  await db.insertInto('teamMemberRelation')
    .values({userId: user.id, teamId: team.id})
    .execute()
    
  return teamJoinedSuccessfuly
}

export const leaveTeam = async (userId: number, chatId: number, name: string) => {
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

export const getTeamMembers = async (chatId: number, name: string) => {
  const team = await getTeamId(chatId, name)

  const data = await db.selectFrom('teamMemberRelation')
    .select('userId')
    .where('teamId', '=', team.id)
    .$castTo<{userId: string}>()
    .execute()

  return data.map(x => x.userId)
}

export const getUserTeams = async (userId: number) => {
  const teams = await db.selectFrom('teamMemberRelation')
    .select('teamId')
    .where('userId', '=', userId)
    .distinct()
    .execute()

  if (teams.length === 0) {
    return []
  }

  const data: Team[] = await db.selectFrom('team')
    .select((eb) => [
      'name',
      jsonArrayFrom(
        eb.selectFrom('teamMemberRelation')
          .leftJoin('user', 'user.id', 'teamMemberRelation.userId')
          .select(['user.id', 'user.username'])
          .whereRef('teamMemberRelation.teamId', '=', 'team.id')
          .limit(6)
      ).as('members')
    ])
    .where('team.id', 'in', teams.map(t => t.teamId))
    .execute()

  return data
}

export const getChatTeams = async (chatId: number) => {
  const data = await db.selectFrom('team')
    .select('name')
    // .select((eb) => [
    //   'name',
    //   jsonArrayFrom(
    //     eb.selectFrom('teamMemberRelation')
    //       .select(['userId'])
    //       .whereRef('teamMemberRelation.teamId', '=', 'team.id')
    //       .limit(10)
    //   ).as('members')
    // ])
    .where('chatId', '=', chatId)
    .execute()

  return data
}
