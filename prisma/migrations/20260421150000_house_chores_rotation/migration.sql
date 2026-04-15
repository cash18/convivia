-- Faccende domestiche a rotazione + collegamento eventi calendario

CREATE TABLE "HouseChore" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "everyDays" INTEGER NOT NULL,
    "anchorDate" DATE NOT NULL,
    "syncCalendar" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseChore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseChoreRotationMember" (
    "id" TEXT NOT NULL,
    "houseChoreId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "HouseChoreRotationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseChoreSwap" (
    "id" TEXT NOT NULL,
    "houseChoreId" TEXT NOT NULL,
    "occurrenceDate" DATE NOT NULL,
    "assigneeUserId" TEXT NOT NULL,
    CONSTRAINT "HouseChoreSwap_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CalendarEvent" ADD COLUMN "houseChoreId" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "choreOccurrenceDate" DATE;

ALTER TABLE "HouseChore" ADD CONSTRAINT "HouseChore_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseChore" ADD CONSTRAINT "HouseChore_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HouseChoreRotationMember" ADD CONSTRAINT "HouseChoreRotationMember_houseChoreId_fkey" FOREIGN KEY ("houseChoreId") REFERENCES "HouseChore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseChoreRotationMember" ADD CONSTRAINT "HouseChoreRotationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HouseChoreSwap" ADD CONSTRAINT "HouseChoreSwap_houseChoreId_fkey" FOREIGN KEY ("houseChoreId") REFERENCES "HouseChore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_houseChoreId_fkey" FOREIGN KEY ("houseChoreId") REFERENCES "HouseChore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "HouseChoreRotationMember_houseChoreId_userId_key" ON "HouseChoreRotationMember"("houseChoreId", "userId");
CREATE INDEX "HouseChoreRotationMember_houseChoreId_idx" ON "HouseChoreRotationMember"("houseChoreId");

CREATE UNIQUE INDEX "HouseChoreSwap_houseChoreId_occurrenceDate_key" ON "HouseChoreSwap"("houseChoreId", "occurrenceDate");

CREATE INDEX "HouseChore_houseId_idx" ON "HouseChore"("houseId");
CREATE INDEX "CalendarEvent_houseChoreId_idx" ON "CalendarEvent"("houseChoreId");
