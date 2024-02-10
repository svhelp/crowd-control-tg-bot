import { TeamMemberRelationTable } from "./teamMemberRelationTable"
import { TeamTable } from "./teamTable"

export interface Database {
    team: TeamTable
    teamMemberRelation: TeamMemberRelationTable
}
