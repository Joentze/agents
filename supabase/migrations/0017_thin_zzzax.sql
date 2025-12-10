DROP TABLE IF EXISTS "artifact_artifact_folder_link";--> statement-breakpoint
ALTER TABLE "artifact" ADD COLUMN "folderId" uuid DEFAULT null;--> statement-breakpoint
ALTER TABLE "artifact_folder" ADD COLUMN "parent_folder_id" uuid;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_folderId_artifact_folder_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."artifact_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_folder" ADD CONSTRAINT "artifact_folder_parent_folder_id_artifact_folder_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."artifact_folder"("id") ON DELETE cascade ON UPDATE no action;