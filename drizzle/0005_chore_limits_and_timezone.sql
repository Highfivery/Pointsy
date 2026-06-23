CREATE TYPE "public"."chore_limit_period" AS ENUM('none', 'day', 'week');--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "limit_period" "chore_limit_period" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "limit_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;