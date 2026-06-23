ALTER TABLE "people" ALTER COLUMN "avatar" SET DEFAULT 'smile';--> statement-breakpoint
-- Existing parents kept the old emoji default (which rendered as a fallback
-- icon). Give them the neutral person avatar.
UPDATE "people" SET "avatar" = 'person' WHERE "role" = 'parent' AND "avatar" = '🙂';