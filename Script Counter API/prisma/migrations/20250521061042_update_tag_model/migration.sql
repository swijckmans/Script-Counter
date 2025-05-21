/*
  Warnings:

  - You are about to drop the `_TagToWebsite` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `count` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `websiteId` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_TagToWebsite_B_index";

-- DropIndex
DROP INDEX "_TagToWebsite_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TagToWebsite";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "websiteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tag_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_name_websiteId_key" ON "Tag"("name", "websiteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
