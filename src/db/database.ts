import { TeamMemberRelationTable } from "./domain/teamMemberRelationTable"
import { TeamTable } from "./domain/teamTable"

export interface Database {
    team: TeamTable
    teamMemberRelation: TeamMemberRelationTable
}
