import { Generated } from "kysely"

export interface TeamMemberRelationTable {
    id: Generated<number>
    userId: string
    teamId: string
}
