ALTER TABLE "rewards" ADD COLUMN "assigned_to_kid_id" uuid;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_assigned_to_kid_id_people_id_fk" FOREIGN KEY ("assigned_to_kid_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rewards_assigned_kid_idx" ON "rewards" USING btree ("assigned_to_kid_id");