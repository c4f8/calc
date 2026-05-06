-- CreateTable
CREATE TABLE "AdminPasskey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "webAuthnUserId" TEXT NOT NULL,
    "publicKey" BLOB NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastUsedAt" DATETIME,
    CONSTRAINT "AdminPasskey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAuthChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "challenge" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AdminPasskey_userId_idx" ON "AdminPasskey"("userId");

-- CreateIndex
CREATE INDEX "AdminAuthChallenge_type_userId_idx" ON "AdminAuthChallenge"("type", "userId");

-- CreateIndex
CREATE INDEX "AdminAuthChallenge_expiresAt_idx" ON "AdminAuthChallenge"("expiresAt");
