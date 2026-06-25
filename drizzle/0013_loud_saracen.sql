CREATE TYPE "public"."team_member_status" AS ENUM('invited', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."team_redemption_status" AS ENUM('proposed', 'approved', 'fulfilled', 'denied', 'cancelled');--> statement-breakpoint
CREATE TABLE "team_redemption_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_redemption_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"share" integer NOT NULL,
	"status" "team_member_status" DEFAULT 'invited' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"reward_id" uuid,
	"reward_name" text NOT NULL,
	"cost" integer NOT NULL,
	"proposed_by" uuid NOT NULL,
	"status" "team_redemption_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"fulfilled_by" uuid,
	"fulfilled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "is_team" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "min_kids" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "team_redemption_members" ADD CONSTRAINT "team_redemption_members_team_redemption_id_team_redemptions_id_fk" FOREIGN KEY ("team_redemption_id") REFERENCES "public"."team_redemptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_redemption_members" ADD CONSTRAINT "team_redemption_members_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_redemptions" ADD CONSTRAINT "team_redemptions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_redemptions" ADD CONSTRAINT "team_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_redemptions" ADD CONSTRAINT "team_redemptions_proposed_by_people_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_redemptions" ADD CONSTRAINT "team_redemptions_decided_by_people_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_redemptions" ADD CONSTRAINT "team_redemptions_fulfilled_by_people_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_members_redemption_idx" ON "team_redemption_members" USING btree ("team_redemption_id");--> statement-breakpoint
CREATE INDEX "team_members_person_idx" ON "team_redemption_members" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_unique" ON "team_redemption_members" USING btree ("team_redemption_id","person_id");--> statement-breakpoint
CREATE INDEX "team_redemptions_family_idx" ON "team_redemptions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "team_redemptions_status_idx" ON "team_redemptions" USING btree ("status");