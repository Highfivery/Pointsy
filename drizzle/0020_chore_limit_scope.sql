CREATE TYPE "public"."chore_limit_scope" AS ENUM('per_kid', 'total');--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "limit_scope" "chore_limit_scope" DEFAULT 'per_kid' NOT NULL;