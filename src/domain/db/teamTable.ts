import { Generated } from "kysely"

export interface TeamTable {
    id: Generated<number>
    name: string
    chatId: string
    creatorId: string
}
