CREATE TABLE "secret" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"vault_secret_id" uuid NOT NULL,
	CONSTRAINT "secret_pk" PRIMARY KEY("id","vault_secret_id")
);
--> statement-breakpoint
ALTER TABLE "secret" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "secret" ADD CONSTRAINT "secret_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "user can create secret" ON "secret" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can delete secret" ON "secret" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("secret"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can read secret" ON "secret" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("secret"."created_by" = auth.uid());