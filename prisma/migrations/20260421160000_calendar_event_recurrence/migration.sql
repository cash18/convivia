-- Ricorrenza opzionale per eventi calendario (RRULE nel feed ICS).
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceRule" TEXT;
