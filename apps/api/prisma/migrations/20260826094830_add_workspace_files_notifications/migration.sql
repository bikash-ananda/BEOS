-- CreateEnum
CREATE TYPE "WorkspaceFileScope" AS ENUM ('COMPANY', 'BRANCH', 'DEPARTMENT');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileRecord" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAttachment" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "scope" "WorkspaceFileScope" NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileRecord_storageKey_key" ON "FileRecord"("storageKey");

-- CreateIndex
CREATE INDEX "FileRecord_uploadedById_createdAt_idx" ON "FileRecord"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "FileRecord_createdAt_idx" ON "FileRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceAttachment_fileId_key" ON "WorkspaceAttachment"("fileId");

-- CreateIndex
CREATE INDEX "WorkspaceAttachment_scope_createdAt_idx" ON "WorkspaceAttachment"("scope", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceAttachment_branchId_createdAt_idx" ON "WorkspaceAttachment"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkspaceAttachment_departmentId_createdAt_idx" ON "WorkspaceAttachment"("departmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRecord" ADD CONSTRAINT "FileRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAttachment" ADD CONSTRAINT "WorkspaceAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAttachment" ADD CONSTRAINT "WorkspaceAttachment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAttachment" ADD CONSTRAINT "WorkspaceAttachment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
