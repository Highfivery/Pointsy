CREATE TYPE "public"."ledger_type" AS ENUM('earn', 'redeem', 'adjust');--> statement-breakpoint
CREATE TYPE "public"."redemption_status" AS ENUM('requested', 'approved', 'fulfilled', 'denied', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('parent', 'kid');--> statement-breakpoint
CREATE TABLE "chores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '✅' NOT NULL,
	"points" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "families_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"type" "ledger_type" NOT NULL,
	"reason" text NOT NULL,
	"chore_id" uuid,
	"reward_id" uuid,
	"redemption_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"name" text NOT NULL,
	"avatar" text DEFAULT '🙂' NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"email" text,
	"password_hash" text,
	"pin_hash" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"reward_id" uuid,
	"reward_name" text NOT NULL,
	"cost" integer NOT NULL,
	"status" "redemption_status" DEFAULT 'requested' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"fulfilled_by" uuid,
	"fulfilled_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎁' NOT NULL,
	"cost" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_redemption_id_redemptions_id_fk" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_decided_by_people_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_fulfilled_by_people_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chores_family_idx" ON "chores" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "ledger_family_idx" ON "ledger" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "ledger_person_idx" ON "ledger" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "people_family_idx" ON "people" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "people_email_unique" ON "people" USING btree ("email");--> statement-breakpoint
CREATE INDEX "redemptions_family_idx" ON "redemptions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "redemptions_person_idx" ON "redemptions" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "redemptions_status_idx" ON "redemptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rewards_family_idx" ON "rewards" USING btree ("family_id");