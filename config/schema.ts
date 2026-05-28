import {
  json,
  integer,
  pgTable,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().default(2),
});

export const projectTable = pgTable("projects", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar({ length: 255 }),
  createdBy: varchar({ length: 255 }).references(() => usersTable.email),
  createdOn: timestamp().defaultNow(),
});

export const frameTable = pgTable("frames", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  frameId: varchar({ length: 255 }),
  designCode: text(),
  projectId: varchar({ length: 255 }).references(() => projectTable.projectId),
  createdOn: timestamp().defaultNow(),
});

export const chatTable = pgTable("chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chatMessage: json(),
  frameId: varchar({ length: 255 }).references(() => frameTable.frameId),
  createdBy: varchar({ length: 255 }).references(() => usersTable.email),
  createdOn: timestamp().defaultNow(),
});
