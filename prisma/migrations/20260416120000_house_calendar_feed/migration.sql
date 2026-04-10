-- Token opaco per feed ICS (Google / Apple); solo chi ha il link vede gli eventi della casa.

ALTER TABLE "House" ADD COLUMN "calendarFeedToken" TEXT;

UPDATE "House"
SET "calendarFeedToken" = REPLACE(gen_random_uuid()::text, '-', '')
WHERE "calendarFeedToken" IS NULL;

ALTER TABLE "House" ALTER COLUMN "calendarFeedToken" SET NOT NULL;

CREATE UNIQUE INDEX "House_calendarFeedToken_key" ON "House"("calendarFeedToken");
