CREATE TABLE "artifact_artifact_folder_link" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"artifactId" uuid,
	"artifactFolderId" uuid,
	CONSTRAINT "artifact_artifact_folder_link_pk" PRIMARY KEY("artifactId","artifactFolderId")
);
--> statement-breakpoint
ALTER TABLE "artifact_artifact_folder_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "artifact_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artifact_folder" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "artifact_artifact_folder_link" ADD CONSTRAINT "artifact_artifact_folder_link_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_artifact_folder_link" ADD CONSTRAINT "artifact_artifact_folder_link_artifactId_artifact_id_fk" FOREIGN KEY ("artifactId") REFERENCES "public"."artifact"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_artifact_folder_link" ADD CONSTRAINT "artifact_artifact_folder_link_artifactFolderId_artifact_folder_id_fk" FOREIGN KEY ("artifactFolderId") REFERENCES "public"."artifact_folder"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_folder" ADD CONSTRAINT "artifact_folder_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "user can create artifact artifact folder link" ON "artifact_artifact_folder_link" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can create artifact folder" ON "artifact_folder" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() is not null);--> statement-breakpoint
CREATE POLICY "user can update artifact folder" ON "artifact_folder" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("artifact_folder"."created_by" = auth.uid());--> statement-breakpoint
CREATE POLICY "user can delete artifact folder" ON "artifact_folder" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("artifact_folder"."created_by" = auth.uid());