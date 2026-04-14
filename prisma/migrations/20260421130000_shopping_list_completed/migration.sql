-- When set, the list is archived as "shopping completed" (e.g. after recording an expense from checked items).
ALTER TABLE "ShoppingList" ADD COLUMN "completedAt" TIMESTAMP(3);
