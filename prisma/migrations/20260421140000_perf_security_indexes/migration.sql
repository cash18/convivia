-- Indici per query frequenti per houseId / join spese (performance).
CREATE INDEX "Expense_houseId_idx" ON "Expense"("houseId");
CREATE INDEX "Expense_houseId_expenseDate_idx" ON "Expense"("houseId", "expenseDate" DESC);
CREATE INDEX "ExpenseSplit_expenseId_idx" ON "ExpenseSplit"("expenseId");
CREATE INDEX "HouseMember_houseId_idx" ON "HouseMember"("houseId");
CREATE INDEX "CalendarEvent_houseId_idx" ON "CalendarEvent"("houseId");
CREATE INDEX "CalendarEvent_houseId_startsAt_idx" ON "CalendarEvent"("houseId", "startsAt");
CREATE INDEX "Task_houseId_idx" ON "Task"("houseId");
