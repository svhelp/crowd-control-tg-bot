import { Generated } from "kysely"

export interface TeamMemberRelationTable {
    id: Generated<number>
    userId: number
    teamId: number
}
