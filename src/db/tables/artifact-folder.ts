import {
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { sql } from "drizzle-orm";
import { authenticatedRole } from "drizzle-orm/supabase";
import { artifactTable } from "./artifact";

const artifactFolder = pgTable(
  "artifact_folder",
  {
    ...DEFAULT_COLUMNS,
    ...DEFAULT_CREATED_BY_COLUMN,
    name: text("name").notNull(),
    parentFolderId: uuid("parent_folder_id").references(
      (): any => artifactFolder.id,
      { onDelete: "cascade" }
    ),
  },
  (table) => [
    pgPolicy("user can read artifact folder", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can create artifact folder", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can update artifact folder", {
      for: "update",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can delete artifact folder", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
  ]
);

export { artifactFolder };
