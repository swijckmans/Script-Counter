/*
  Warnings:

  - Made the column `rawResults` on table `Analysis` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "websiteId" INTEGER NOT NULL,
    "firstPartyCount" INTEGER NOT NULL,
    "thirdPartyCount" INTEGER NOT NULL,
    "inlineCount" INTEGER NOT NULL,
    "rawResults" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Analysis_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Analysis" ("createdAt", "firstPartyCount", "id", "inlineCount", "rawResults", "thirdPartyCount", "updatedAt", "websiteId") SELECT "createdAt", "firstPartyCount", "id", "inlineCount", "rawResults", "thirdPartyCount", "updatedAt", "websiteId" FROM "Analysis";
DROP TABLE "Analysis";
ALTER TABLE "new_Analysis" RENAME TO "Analysis";
CREATE TABLE "new_Website" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "screenshotPath" TEXT,
    "lastAnalyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Website" ("createdAt", "id", "lastAnalyzedAt", "screenshotPath", "updatedAt", "url") SELECT "createdAt", "id", coalesce("lastAnalyzedAt", CURRENT_TIMESTAMP) AS "lastAnalyzedAt", "screenshotPath", "updatedAt", "url" FROM "Website";
DROP TABLE "Website";
ALTER TABLE "new_Website" RENAME TO "Website";
CREATE UNIQUE INDEX "Website_url_key" ON "Website"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
