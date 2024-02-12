import { TeamMemberRelationTable } from "./domain/teamMemberRelationTable"
import { TeamTable } from "./domain/teamTable"
import { UserTable } from "./domain/userTable"

export interface Database {
    team: TeamTable
    teamMemberRelation: TeamMemberRelationTable
    user: UserTable
}
