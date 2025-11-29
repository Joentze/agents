import { sql } from "drizzle-orm";
import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

const DEFAULT_COLUMNS = {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};

const authSchema = pgSchema("auth");

const authUsersTable = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
});

const DEFAULT_CREATED_BY_COLUMN = {
  createdBy: uuid("created_by")
    .default(sql`auth.uid()`)
    .notNull()
    .references(() => authUsersTable.id),
};

export { authUsersTable, DEFAULT_COLUMNS, DEFAULT_CREATED_BY_COLUMN };
