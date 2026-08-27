-- CreateEnum
CREATE TYPE "ReactionKind" AS ENUM ('ACKNOWLEDGE', 'SUPPORT', 'CELEBRATE');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('COMPANY', 'DEPARTMENT', 'PRIVATE_GROUP', 'DIRECT');

-- CreateEnum
CREATE TYPE "AnnouncementTarget" AS ENUM ('COMPANY', 'BRANCH', 'DEPARTMENT', 'USERS');

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionComment" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReaction" (
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionReaction_pkey" PRIMARY KEY ("discussionId","userId")
);

-- CreateTable
CREATE TABLE "DiscussionCommentReaction" (
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ReactionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionCommentReaction_pkey" PRIMARY KEY ("commentId","userId")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "name" TEXT,
    "departmentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationReadReceipt" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationReadReceipt_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target" "AnnouncementTarget" NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "authorId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRecipient" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "AnnouncementRecipient_pkey" PRIMARY KEY ("announcementId","userId")
);

-- CreateIndex
CREATE INDEX "Discussion_deletedAt_createdAt_idx" ON "Discussion"("deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Discussion_authorId_createdAt_idx" ON "Discussion"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionComment_discussionId_deletedAt_createdAt_idx" ON "DiscussionComment"("discussionId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionComment_authorId_createdAt_idx" ON "DiscussionComment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionReaction_discussionId_kind_idx" ON "DiscussionReaction"("discussionId", "kind");

-- CreateIndex
CREATE INDEX "DiscussionCommentReaction_commentId_kind_idx" ON "DiscussionCommentReaction"("commentId", "kind");

-- CreateIndex
CREATE INDEX "Conversation_type_updatedAt_idx" ON "Conversation"("type", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_departmentId_updatedAt_idx" ON "Conversation"("departmentId", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_createdById_idx" ON "Conversation"("createdById");

-- CreateIndex
CREATE INDEX "ConversationMember_userId_joinedAt_idx" ON "ConversationMember"("userId", "joinedAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_deletedAt_createdAt_idx" ON "ConversationMessage"("conversationId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_authorId_createdAt_idx" ON "ConversationMessage"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationReadReceipt_userId_readAt_idx" ON "ConversationReadReceipt"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Announcement_deletedAt_createdAt_idx" ON "Announcement"("deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_branchId_createdAt_idx" ON "Announcement"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_departmentId_createdAt_idx" ON "Announcement"("departmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AnnouncementRecipient_userId_readAt_idx" ON "AnnouncementRecipient"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionComment" ADD CONSTRAINT "DiscussionComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionComment" ADD CONSTRAINT "DiscussionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionCommentReaction" ADD CONSTRAINT "DiscussionCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "DiscussionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionCommentReaction" ADD CONSTRAINT "DiscussionCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadReceipt" ADD CONSTRAINT "ConversationReadReceipt_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadReceipt" ADD CONSTRAINT "ConversationReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipient" ADD CONSTRAINT "AnnouncementRecipient_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipient" ADD CONSTRAINT "AnnouncementRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
