CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "chore_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"chore_id" uuid,
	"chore_name" text NOT NULL,
	"points" integer NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"local_date" text NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chore_submissions" ADD CONSTRAINT "chore_submissions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_submissions" ADD CONSTRAINT "chore_submissions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_submissions" ADD CONSTRAINT "chore_submissions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_submissions" ADD CONSTRAINT "chore_submissions_decided_by_people_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chore_submissions_family_idx" ON "chore_submissions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "chore_submissions_person_idx" ON "chore_submissions" USING btree ("person_id");