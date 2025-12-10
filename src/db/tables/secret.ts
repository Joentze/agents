import {
  pgPolicy,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { DEFAULT_CREATED_BY_COLUMN } from "../utils/column";
import { authenticatedRole } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";

export const secretTable = pgTable(
  "secret",
  {
    id: uuid("id")
      .notNull()
      .default(sql`gen_random_uuid()`),
    ...DEFAULT_CREATED_BY_COLUMN,
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    vaultSecretId: uuid("vault_secret_id").notNull(),
  },
  (table) => [
    primaryKey({
      name: "secret_pk",
      columns: [table.id, table.vaultSecretId],
    }),
    pgPolicy("user can create secret", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`auth.uid() is not null`,
    }),
    pgPolicy("user can delete secret", {
      for: "delete",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can read secret", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
    pgPolicy("user can update secret", {
      for: "select",
      to: authenticatedRole,
      using: sql.join([sql`${table.createdBy} = auth.uid()`], sql` or `),
    }),
  ]
);
