CREATE TYPE "public"."challenge_goal" AS ENUM('points', 'chore_count', 'core_days');--> statement-breakpoint
CREATE TYPE "public"."challenge_scope" AS ENUM('kid', 'family');--> statement-breakpoint
ALTER TYPE "public"."ledger_type" ADD VALUE 'bonus';--> statement-breakpoint
CREATE TABLE "challenge_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"person_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scope" "challenge_scope" DEFAULT 'kid' NOT NULL,
	"goal_type" "challenge_goal" NOT NULL,
	"goal_target" integer NOT NULL,
	"bonus_points" integer NOT NULL,
	"starts_on" text NOT NULL,
	"ends_on" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_awards" ADD CONSTRAINT "challenge_awards_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_awards" ADD CONSTRAINT "challenge_awards_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_awards_challenge_idx" ON "challenge_awards" USING btree ("challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_awards_unique" ON "challenge_awards" USING btree ("challenge_id","person_id");--> statement-breakpoint
CREATE INDEX "challenge_participants_challenge_idx" ON "challenge_participants" USING btree ("challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_participants_unique" ON "challenge_participants" USING btree ("challenge_id","person_id");--> statement-breakpoint
CREATE INDEX "challenges_family_idx" ON "challenges" USING btree ("family_id");