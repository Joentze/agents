import { pgPolicy, pgTable, text } from "drizzle-orm/pg-core";
import { DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { authenticatedRole } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";

const chatTable = pgTable(
  "chat",
  {
    ...DEFAULT_COLUMNS,
    ...DEFAULT_CREATED_BY_COLUMN,
    name: text("name").notNull().default("New Chat"),
  },
  (table) => [
    pgPolicy("user can create chat", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can update chat", {
      for: "update",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),

    pgPolicy("user can delete chat", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read chat", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
  ]
);

export { chatTable };
