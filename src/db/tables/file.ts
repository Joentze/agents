import { integer, pgEnum, pgPolicy, pgTable, text } from "drizzle-orm/pg-core";
import { DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { authenticatedRole } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";

const fileType = pgEnum("file_type", ["image", "document", "csv"]);

const fileTable = pgTable(
  "file",
  {
    ...DEFAULT_COLUMNS,
    ...DEFAULT_CREATED_BY_COLUMN,
    name: text("name").notNull(),
    type: fileType("type").notNull(),
    mimeType: text("mimeType").notNull(),
    originalMimeType: text("originalMimeType").notNull(),
    size: integer("size").notNull(),
    url: text("url").notNull(),
  },
  (table) => [
    pgPolicy("user can create file", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can update file", {
      for: "update",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can delete file", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read file", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
  ]
);

export { fileTable, fileType };
