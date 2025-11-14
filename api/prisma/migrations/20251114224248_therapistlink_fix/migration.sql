/*
  Warnings:

  - You are about to drop the `TherapistClient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TherapistClient";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TherapistLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "therapistId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "TherapistLink_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TherapistLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TherapistLink_therapistId_clientId_key" ON "TherapistLink"("therapistId", "clientId");
