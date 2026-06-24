CREATE TYPE "public"."chore_category" AS ENUM('bedroom', 'bathroom', 'kitchen', 'home', 'outdoor', 'pets', 'school', 'selfcare', 'other');--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "category" "chore_category" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "goal_reward_id" uuid;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_goal_reward_id_rewards_id_fk" FOREIGN KEY ("goal_reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;