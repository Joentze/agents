CREATE TYPE "public"."file_type" AS ENUM('image', 'document', 'csv');--> statement-breakpoint
CREATE TABLE "file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"type" "file_type" NOT NULL,
	"mimeType" text NOT NULL,
	"originalMimeType" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "user can create file" ON "file" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can update file" ON "file" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("file"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can delete file" ON "file" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("file"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can read file" ON "file" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("file"."created_by" = auth.uid());