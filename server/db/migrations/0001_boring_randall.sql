ALTER TABLE "projects" DROP CONSTRAINT "projects_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "projects_name_lower_idx" ON "projects" USING btree (lower("name"));