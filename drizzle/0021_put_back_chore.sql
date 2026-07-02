ALTER TYPE "public"."submission_status" ADD VALUE 'reversed';--> statement-breakpoint
ALTER TABLE "ledger" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "ledger" ADD COLUMN "reverses_id" uuid;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_submission_id_chore_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."chore_submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_reverses_id_ledger_id_fk" FOREIGN KEY ("reverses_id") REFERENCES "public"."ledger"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_reverses_unique" ON "ledger" USING btree ("reverses_id") WHERE "ledger"."reverses_id" is not null;