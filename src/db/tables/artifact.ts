import {
  boolean,
  index,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { chatTable as chat } from "./chat";
import { artifactFolder } from "./artifact-folder";

const artifactTable = pgTable(
  "artifact",
  {
    ...DEFAULT_COLUMNS,
    ...DEFAULT_CREATED_BY_COLUMN,
    callId: text("callId"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    chatId: uuid("chatId").references(() => chat.id),
    public: boolean("public").notNull().default(false),
    folderId: uuid("folderId")
      .references(() => artifactFolder.id, {
        onDelete: "cascade",
      })
      .default(sql`null`),
  },
  (table) => [
    index("artifact_call_id_idx").on(table.callId),
    pgPolicy("user can create artifact", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can update artifact", {
      for: "update",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can delete artifact", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read artifact", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read public artifact", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.public} = true`], sql` or `),
    }),
  ]
);

export { artifactTable };
