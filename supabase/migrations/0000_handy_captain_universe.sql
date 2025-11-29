CREATE TABLE "artifact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"callId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"chatId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artifact" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"callId" text NOT NULL,
	"files" json NOT NULL,
	"logs" json NOT NULL,
	"chatId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"name" text DEFAULT 'New Chat' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"chatId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifact_call_id_idx" ON "artifact" USING btree ("callId");--> statement-breakpoint
CREATE INDEX "app_call_id_idx" ON "app" USING btree ("callId");--> statement-breakpoint
CREATE POLICY "user can create artifact" ON "artifact" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can update artifact" ON "artifact" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("artifact"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can delete artifact" ON "artifact" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("artifact"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can read artifact" ON "artifact" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("artifact"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can create app" ON "app" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can update app" ON "app" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("app"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can delete app" ON "app" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("app"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can read app" ON "app" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("app"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can create chat" ON "chat" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can update chat" ON "chat" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("chat"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can delete chat" ON "chat" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("chat"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can read chat" ON "chat" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("chat"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can create message" ON "message" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can update message" ON "message" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("message"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can delete message" ON "message" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("message"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can read message" ON "message" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("message"."created_by" = auth.uid());