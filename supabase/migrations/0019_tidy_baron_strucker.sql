CREATE TYPE "public"."artifact_type" AS ENUM('default', 'code');--> statement-breakpoint
ALTER TABLE "artifact" ADD COLUMN "type" "artifact_type" DEFAULT 'default' NOT NULL;