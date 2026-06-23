ALTER TABLE "people" ADD COLUMN "pin_failed_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "pin_locked_until" timestamp with time zone;