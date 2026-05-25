-- CreateTable
CREATE TABLE "AdminAuditEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "actorEmail" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "AdminAuditEvent_type_createdAt_idx" ON "AdminAuditEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_userId_createdAt_idx" ON "AdminAuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminRateLimit_resetAt_idx" ON "AdminRateLimit"("resetAt");
