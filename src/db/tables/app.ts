import {
  index,
  json,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { chatTable as chat } from "./chat";
import { authenticatedRole } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";

const appTable = pgTable(
  "app",
  {
    ...DEFAULT_COLUMNS,
    ...DEFAULT_CREATED_BY_COLUMN,
    name: text("name").notNull(),
    callId: text("callId").notNull(),
    files: json("files").notNull(),
    logs: json("logs").notNull(),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
  },
  (table) => [
    index("app_call_id_idx").on(table.callId),
    pgPolicy("user can create app", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can update app", {
      for: "update",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can delete app", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read app", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
  ]
);

export { appTable };
