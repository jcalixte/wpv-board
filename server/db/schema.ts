// Drizzle (Postgres) schema (C8).
// `section_id` is a plain string referencing the in-code board section ids
// (C1) — no foreign key, because sections live in code, not the DB (ADR 0001).
import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().$defaultFn(randomUUID),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // Case-insensitive uniqueness: "Acme" and "acme" are the same project (F3).
  (t) => [uniqueIndex('projects_name_lower_idx').on(sql`lower(${t.name})`)],
)

export const defects = pgTable('defects', {
  id: uuid('id').primaryKey().$defaultFn(randomUUID),
  sectionId: text('section_id').notNull(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  verbatim: text('verbatim').notNull(),
  reporterEmail: text('reporter_email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().$defaultFn(randomUUID),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  reporterEmail: text('reporter_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
