-- Fine ricorrenza faccende (limite temporale lato app + max 365 occorrenze).
ALTER TABLE "HouseChore" ADD COLUMN "recurrenceEndDate" DATE;

UPDATE "HouseChore"
SET "recurrenceEndDate" = ("anchorDate" + INTERVAL '365 days')::date
WHERE "recurrenceEndDate" IS NULL;

ALTER TABLE "HouseChore" ALTER COLUMN "recurrenceEndDate" SET NOT NULL;

-- Evento calendario opzionale generato da un task (compito con data/ora).
ALTER TABLE "CalendarEvent" ADD COLUMN "taskId" TEXT;

CREATE UNIQUE INDEX "CalendarEvent_taskId_key" ON "CalendarEvent"("taskId");

ALTER TABLE "CalendarEvent"
ADD CONSTRAINT "CalendarEvent_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CalendarEvent_taskId_idx" ON "CalendarEvent"("taskId");
