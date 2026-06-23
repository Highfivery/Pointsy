CREATE TABLE "parent_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"created_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_invites_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "owner_id" uuid;--> statement-breakpoint
ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_redeemed_by_people_id_fk" FOREIGN KEY ("redeemed_by") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parent_invites_family_idx" ON "parent_invites" USING btree ("family_id");--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_owner_id_people_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill: the earliest parent of each existing family becomes its owner.
UPDATE "families" SET "owner_id" = (
	SELECT "p"."id" FROM "people" "p"
	WHERE "p"."family_id" = "families"."id" AND "p"."role" = 'parent'
	ORDER BY "p"."created_at" ASC, "p"."id" ASC
	LIMIT 1
) WHERE "owner_id" IS NULL;