import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable('user')
        .addColumn('id', 'bigint', (col) => col.primaryKey())
        .addColumn('name', 'varchar(50)', (col) => col.notNull())
        .addColumn('username', 'varchar(50)')
        .execute()

    await db.schema
        .createTable('team')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('name', 'varchar(20)', (col) => col.notNull())
        .addColumn('chatId', 'bigint', (col) => col.notNull())
        .addColumn('creatorId', 'bigint', (col) =>
            col.references('user.id').onDelete('set null'))
        .execute()

    await db.schema
        .createTable('teamMemberRelation')
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('userId', 'bigint', (col) =>
            col.references('user.id').onDelete('set null'))
        .addColumn('teamId', 'integer', (col) =>
            col.references('team.id').onDelete('cascade').notNull())
        .execute()

    await db.schema
        .createIndex('member_team_id_index')
        .on('teamMemberRelation')
        .column('teamId')
        .execute()
        
    await db.schema
        .createIndex('member_user_id_index')
        .on('teamMemberRelation')
        .column('userId')
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropIndex('member_user_id_index').execute()
    await db.schema.dropIndex('member_team_id_index').execute()
    
    await db.schema.dropTable('teamMemberRelation').execute()
    await db.schema.dropTable('user').execute()
    await db.schema.dropTable('team').execute()
}
