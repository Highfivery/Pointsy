CREATE TYPE "public"."challenge_award_status" AS ENUM('pending', 'paid', 'denied');--> statement-breakpoint
ALTER TABLE "challenge_awards" ADD COLUMN "status" "challenge_award_status" DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "auto_award" boolean DEFAULT true NOT NULL;