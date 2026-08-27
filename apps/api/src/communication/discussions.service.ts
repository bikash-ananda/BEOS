import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReactionKind } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationListQueryDto,
  CreateCommentDto,
  CreateDiscussionDto,
  UpdateDiscussionDto,
} from './dto/communication.dto';
import { WorkspaceEventsService } from '../live/workspace-events.service';

const discussionInclude = {
  author: { select: { id: true, fullName: true } },
  reactions: { select: { userId: true, kind: true } },
  _count: { select: { comments: { where: { deletedAt: null } } } },
} satisfies Prisma.DiscussionInclude;

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: WorkspaceEventsService,
  ) {}

  async list(user: AuthenticatedUser, query: CommunicationListQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.DiscussionWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.discussion.findMany({
        where,
        include: discussionInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.discussion.count({ where }),
    ]);
    return {
      items: items.map((item) => this.present(item, user.id)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async create(
    user: AuthenticatedUser,
    input: CreateDiscussionDto,
    ipAddress?: string,
  ) {
    const discussion = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.discussion.create({
        data: {
          title: input.title.trim(),
          body: input.body.trim(),
          authorId: user.id,
        },
        include: discussionInclude,
      });
      await this.audit.record(
        {
          action: 'communication.discussion_created',
          entityType: 'Discussion',
          entityId: created.id,
          userId: user.id,
          ipAddress,
        },
        transaction,
      );
      return created;
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'created',
      id: discussion.id,
    });
    return this.present(discussion, user.id);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateDiscussionDto,
    ipAddress?: string,
  ) {
    const current = await this.findDiscussion(id);
    this.assertOwnerOrManager(user, current.authorId);
    const discussion = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.discussion.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.body !== undefined && { body: input.body.trim() }),
          editedAt: new Date(),
        },
        include: discussionInclude,
      });
      await this.audit.record(
        {
          action: 'communication.discussion_updated',
          entityType: 'Discussion',
          entityId: id,
          userId: user.id,
          ipAddress,
        },
        transaction,
      );
      return updated;
    });
    this.events.emitAll({ resource: 'discussion', action: 'updated', id });
    return this.present(discussion, user.id);
  }

  async remove(user: AuthenticatedUser, id: string, ipAddress?: string) {
    const current = await this.findDiscussion(id);
    this.assertOwnerOrManager(user, current.authorId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.discussion.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.audit.record(
        {
          action: 'communication.discussion_deleted',
          entityType: 'Discussion',
          entityId: id,
          userId: user.id,
          ipAddress,
        },
        transaction,
      );
    });
    this.events.emitAll({ resource: 'discussion', action: 'deleted', id });
    return { id };
  }

  async listComments(
    user: AuthenticatedUser,
    discussionId: string,
    query: CommunicationListQueryDto,
  ) {
    await this.findDiscussion(discussionId);
    const where = { discussionId, deletedAt: null };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.discussionComment.findMany({
        where,
        include: {
          author: { select: { id: true, fullName: true } },
          reactions: { select: { userId: true, kind: true } },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.discussionComment.count({ where }),
    ]);
    return {
      items: items.map((item) => this.presentReaction(item, user.id)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async createComment(
    user: AuthenticatedUser,
    discussionId: string,
    input: CreateCommentDto,
  ) {
    await this.findDiscussion(discussionId);
    const comment = await this.prisma.discussionComment.create({
      data: { discussionId, authorId: user.id, body: input.body.trim() },
      include: {
        author: { select: { id: true, fullName: true } },
        reactions: { select: { userId: true, kind: true } },
      },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'updated',
      id: discussionId,
    });
    return this.presentReaction(comment, user.id);
  }

  async updateComment(
    user: AuthenticatedUser,
    id: string,
    input: CreateCommentDto,
  ) {
    const current = await this.findComment(id);
    this.assertOwnerOrManager(user, current.authorId);
    const comment = await this.prisma.discussionComment.update({
      where: { id },
      data: { body: input.body.trim(), editedAt: new Date() },
      include: {
        author: { select: { id: true, fullName: true } },
        reactions: { select: { userId: true, kind: true } },
      },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'updated',
      id: current.discussionId,
    });
    return this.presentReaction(comment, user.id);
  }

  async removeComment(user: AuthenticatedUser, id: string) {
    const current = await this.findComment(id);
    this.assertOwnerOrManager(user, current.authorId);
    await this.prisma.discussionComment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'updated',
      id: current.discussionId,
    });
    return { id };
  }

  async reactToDiscussion(
    user: AuthenticatedUser,
    discussionId: string,
    kind: ReactionKind,
  ) {
    await this.findDiscussion(discussionId);
    await this.prisma.discussionReaction.upsert({
      where: { discussionId_userId: { discussionId, userId: user.id } },
      create: { discussionId, userId: user.id, kind },
      update: { kind },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'reacted',
      id: discussionId,
    });
    return { discussionId, kind };
  }

  async clearDiscussionReaction(user: AuthenticatedUser, discussionId: string) {
    await this.prisma.discussionReaction.deleteMany({
      where: { discussionId, userId: user.id },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'reacted',
      id: discussionId,
    });
    return { discussionId };
  }

  async reactToComment(
    user: AuthenticatedUser,
    commentId: string,
    kind: ReactionKind,
  ) {
    const comment = await this.findComment(commentId);
    await this.prisma.discussionCommentReaction.upsert({
      where: { commentId_userId: { commentId, userId: user.id } },
      create: { commentId, userId: user.id, kind },
      update: { kind },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'reacted',
      id: comment.discussionId,
    });
    return { commentId, kind };
  }

  async clearCommentReaction(user: AuthenticatedUser, commentId: string) {
    const comment = await this.findComment(commentId);
    await this.prisma.discussionCommentReaction.deleteMany({
      where: { commentId, userId: user.id },
    });
    this.events.emitAll({
      resource: 'discussion',
      action: 'reacted',
      id: comment.discussionId,
    });
    return { commentId };
  }

  private async findDiscussion(id: string) {
    const discussion = await this.prisma.discussion.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!discussion) throw new NotFoundException('Discussion not found');
    return discussion;
  }

  private async findComment(id: string) {
    const comment = await this.prisma.discussionComment.findFirst({
      where: { id, deletedAt: null, discussion: { deletedAt: null } },
      select: { id: true, authorId: true, discussionId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private assertOwnerOrManager(user: AuthenticatedUser, ownerId: string) {
    if (
      user.id !== ownerId &&
      !user.permissions.includes('communication.manage')
    ) {
      throw new ForbiddenException('You cannot change this record');
    }
  }

  private present<
    T extends { reactions: Array<{ userId: string; kind: ReactionKind }> },
  >(item: T, userId: string) {
    return this.presentReaction(item, userId);
  }

  private presentReaction<
    T extends { reactions: Array<{ userId: string; kind: ReactionKind }> },
  >(item: T, userId: string) {
    const counts = { ACKNOWLEDGE: 0, SUPPORT: 0, CELEBRATE: 0 };
    for (const reaction of item.reactions) counts[reaction.kind] += 1;
    return {
      ...item,
      reactions: undefined,
      reactionCounts: counts,
      viewerReaction:
        item.reactions.find((reaction) => reaction.userId === userId)?.kind ??
        null,
    };
  }
}
