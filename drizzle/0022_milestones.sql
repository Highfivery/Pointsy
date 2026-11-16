CREATE TYPE "public"."milestone_start" AS ENUM('lifetime', 'from_now');--> statement-breakpoint
CREATE TABLE "milestone_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"milestone_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"counted_from" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone_unlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"milestone_id" uuid,
	"person_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"title" text NOT NULL,
	"reward" text NOT NULL,
	"points" integer NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"fulfilled_by" uuid
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"title" text NOT NULL,
	"reward" text NOT NULL,
	"target" integer NOT NULL,
	"repeats" boolean DEFAULT false NOT NULL,
	"start_mode" "milestone_start" DEFAULT 'lifetime' NOT NULL,
	"all_kids" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "milestone_participants" ADD CONSTRAINT "milestone_participants_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_participants" ADD CONSTRAINT "milestone_participants_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_participants" ADD CONSTRAINT "milestone_participants_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_unlocks" ADD CONSTRAINT "milestone_unlocks_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_unlocks" ADD CONSTRAINT "milestone_unlocks_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_unlocks" ADD CONSTRAINT "milestone_unlocks_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_unlocks" ADD CONSTRAINT "milestone_unlocks_fulfilled_by_people_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "milestone_participants_family_idx" ON "milestone_participants" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "milestone_participants_unique" ON "milestone_participants" USING btree ("milestone_id","person_id");--> statement-breakpoint
CREATE INDEX "milestone_unlocks_family_idx" ON "milestone_unlocks" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "milestone_unlocks_person_idx" ON "milestone_unlocks" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "milestone_unlocks_unique" ON "milestone_unlocks" USING btree ("milestone_id","person_id","seq");--> statement-breakpoint
CREATE INDEX "milestones_family_idx" ON "milestones" USING btree ("family_id");