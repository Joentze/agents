ALTER TABLE "secret" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "secret" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;