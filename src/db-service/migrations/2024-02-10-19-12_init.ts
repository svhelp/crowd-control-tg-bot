import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('team')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('name', 'varchar(20)', (col) => col.notNull())
        .addColumn('chatId', 'varchar', (col) => col.notNull())
        .addColumn('creatorId', 'varchar', (col) => col.notNull())
        .execute()

    await db.schema
        .createTable('teamMemberRelation')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('userId', 'varchar')
        .addColumn('teamId', 'integer', (col) =>
            col.references('team.id').onDelete('cascade').notNull())
        .execute()

    await db.schema
        .createIndex('member_team_id_index')
        .on('teamMemberRelation')
        .column('teamId')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropIndex('member_team_id_index').execute()
    
    await db.schema.dropTable('teamMemberRelation').execute()
    await db.schema.dropTable('team').execute()
}
