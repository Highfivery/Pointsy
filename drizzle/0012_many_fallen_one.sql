CREATE TYPE "public"."challenge_recurrence" AS ENUM('none', 'weekly');--> statement-breakpoint
DROP INDEX "challenge_awards_unique";--> statement-breakpoint
ALTER TABLE "challenge_awards" ADD COLUMN "period_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "recurrence" "challenge_recurrence" DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_awards_unique" ON "challenge_awards" USING btree ("challenge_id","person_id","period_key");