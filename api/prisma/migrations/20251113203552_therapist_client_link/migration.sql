-- CreateTable
CREATE TABLE "TherapistClient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "therapistId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "TherapistClient_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TherapistClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TherapistClient_therapistId_clientId_key" ON "TherapistClient"("therapistId", "clientId");
