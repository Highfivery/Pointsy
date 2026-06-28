-- Custom chore categories: per-family `chore_categories`, with `chores.category`
-- (enum) migrated to a `category_id` FK. Data-preserving: every existing family
-- is seeded with the previous default set and each chore is re-pointed by name,
-- so no chore loses its grouping.

CREATE TABLE "chore_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'sparkles' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chore_categories" ADD CONSTRAINT "chore_categories_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chore_categories_family_idx" ON "chore_categories" USING btree ("family_id");--> statement-breakpoint
-- Seed every existing family with the previous default category set.
INSERT INTO "chore_categories" ("family_id", "name", "icon", "sort_order")
SELECT f."id", d."name", d."icon", d."ord"
FROM "families" f
CROSS JOIN (VALUES
	('Bedroom', 'bed', 0),
	('Bathroom', 'bath', 1),
	('Kitchen', 'cook', 2),
	('Around the home', 'tidy', 3),
	('Outdoor', 'yard', 4),
	('Pets', 'paw', 5),
	('School', 'study', 6),
	('Self-care', 'shower', 7),
	('Other', 'sparkles', 8)
) AS d("name", "icon", "ord");--> statement-breakpoint
-- Add the FK column nullable so we can backfill before enforcing NOT NULL.
ALTER TABLE "chores" ADD COLUMN "category_id" uuid;--> statement-breakpoint
-- Re-point each chore at its family's matching seeded category.
UPDATE "chores" c
SET "category_id" = cc."id"
FROM "chore_categories" cc
WHERE cc."family_id" = c."family_id"
	AND cc."name" = CASE c."category"
		WHEN 'bedroom' THEN 'Bedroom'
		WHEN 'bathroom' THEN 'Bathroom'
		WHEN 'kitchen' THEN 'Kitchen'
		WHEN 'home' THEN 'Around the home'
		WHEN 'outdoor' THEN 'Outdoor'
		WHEN 'pets' THEN 'Pets'
		WHEN 'school' THEN 'School'
		WHEN 'selfcare' THEN 'Self-care'
		ELSE 'Other'
	END;--> statement-breakpoint
ALTER TABLE "chores" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_category_id_chore_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."chore_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chores_category_idx" ON "chores" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "chores" DROP COLUMN "category";--> statement-breakpoint
DROP TYPE "public"."chore_category";
