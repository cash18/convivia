-- AlterTable: sync ICS (DTSTAMP/SEQUENCE) + soft cancel for subscribed calendars
ALTER TABLE "CalendarEvent" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CalendarEvent" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "CalendarEvent" ADD COLUMN "calendarSequence" INTEGER NOT NULL DEFAULT 0;

UPDATE "CalendarEvent" SET "updatedAt" = "createdAt" WHERE true;
