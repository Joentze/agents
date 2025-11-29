import { pgTable, varchar, uuid, json, pgPolicy } from "drizzle-orm/pg-core";
import { DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { chatTable as chat } from "./chat";
import { authenticatedRole } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";

const messageTable = pgTable(
  "message",
  {
    ...DEFAULT_COLUMNS,
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull(),
    metadata: json("metadata").notNull().default({}),
    ...DEFAULT_CREATED_BY_COLUMN,
  },
  (table) => [
    pgPolicy("user can create message", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can update message", {
      for: "update",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can delete message", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read message", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
  ]
);

export { messageTable };
