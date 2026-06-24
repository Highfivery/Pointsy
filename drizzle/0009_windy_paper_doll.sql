CREATE TYPE "public"."chore_assignment" AS ENUM('everyone', 'specific', 'rotating');--> statement-breakpoint
CREATE TABLE "chore_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "is_core" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "assignment" "chore_assignment" DEFAULT 'everyone' NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "current_turn_person_id" uuid;--> statement-breakpoint
ALTER TABLE "chore_assignees" ADD CONSTRAINT "chore_assignees_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_assignees" ADD CONSTRAINT "chore_assignees_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chore_assignees_chore_idx" ON "chore_assignees" USING btree ("chore_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chore_assignees_unique" ON "chore_assignees" USING btree ("chore_id","person_id");--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_current_turn_person_id_people_id_fk" FOREIGN KEY ("current_turn_person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;