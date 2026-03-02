/**
 * Chat feature — API (collections, publications, methods, indexes, rate-limiting).
 *
 * Real-time showcase: messages are delivered to all connected clients instantly
 * via DDP without any polling. Open the app in two browser tabs to see it live.
 *
 * To disable: remove this import from server/main.ts and remove the route
 * entry from AppLayout.tsx.
 */
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import {
  type ChatMessageDoc,
  chatMessageTextSchema,
  type ChatPresenceDoc,
  type ChatRoomDoc,
  chatRoomNameSchema,
  type ChatTypingDoc,
  messageIdSchema,
  messageLimitSchema,
  reactionEmojiSchema,
  roomIdSchema,
} from './schema';

export type { ChatMessageDoc, ChatPresenceDoc, ChatRoomDoc, ChatTypingDoc } from './schema';

export const ChatRooms = new Mongo.Collection<ChatRoomDoc>('chatRooms');
export const ChatMessages = new Mongo.Collection<ChatMessageDoc>('chatMessages');
export const ChatTyping = new Mongo.Collection<ChatTypingDoc>('chatTyping');
export const ChatPresence = new Mongo.Collection<ChatPresenceDoc>('chatPresence');

// ─── Server ───────────────────────────────────────────────────────────────────

if (Meteor.isServer) {
  Meteor.startup(async () => {
    // Indexes
    await ChatMessages.createIndexAsync({ roomId: 1, createdAt: 1 });
    await ChatRooms.createIndexAsync({ createdAt: 1 });
    await ChatTyping.createIndexAsync({ roomId: 1, userId: 1 }, { unique: true });
    await ChatPresence.createIndexAsync({ roomId: 1, connectionId: 1 }, { unique: true });

    // Clean stale presence/typing from previous runs
    await ChatPresence.removeAsync({});
    await ChatTyping.removeAsync({});

    // Periodically clean stale typing entries (> 5 s)
    Meteor.setInterval(async () => {
      const cutoff = new Date(Date.now() - 5_000);
      await ChatTyping.removeAsync({ updatedAt: { $lt: cutoff } });
    }, 3_000);

    // Seed a default "general" room once
    const count = await ChatRooms.rawCollection().countDocuments();
    if (count === 0) {
      await ChatRooms.insertAsync({ name: 'general', createdAt: new Date(), createdBy: 'system' });
    }

    // Rate limiting
    const METHODS = ['chat.sendMessage', 'chat.createRoom', 'chat.toggleReaction'];
    DDPRateLimiter.addRule(
      {
        name: (n) => METHODS.includes(n),
        userId: () => true,
      },
      20,
      10_000,
    );
    DDPRateLimiter.addRule(
      {
        name: (n) => n === 'chat.setTyping',
        userId: () => true,
      },
      30,
      10_000,
    );
  });

  // Publish all rooms (lightweight — just names)
  Meteor.publish('chat.rooms', function () {
    if (!this.userId) return this.ready();
    return ChatRooms.find({}, { sort: { createdAt: 1 } });
  });

  // Publish the most recent messages for a room (newest first via sort, client reverses for display)
  Meteor.publish('chat.messages', function (roomId: string, limit = 50) {
    if (!this.userId) return this.ready();
    check(roomId, String);
    const safeLimit = messageLimitSchema.parse(limit);
    return ChatMessages.find({ roomId }, { sort: { createdAt: -1 }, limit: safeLimit });
  });

  // Publish who is currently typing in a room (excludes the subscriber)
  Meteor.publish('chat.typing', function (roomId: string) {
    if (!this.userId) return this.ready();
    check(roomId, String);
    return ChatTyping.find({ roomId, userId: { $ne: this.userId } });
  });

  // Publish presence (who is online) for a room – lifecycle-managed
  Meteor.publish('chat.presence', async function (roomId: string) {
    if (!this.userId) return this.ready();
    check(roomId, String);

    const connId = this.connection?.id ?? '';
    const user = await Meteor.users.findOneAsync(this.userId);
    const email = user?.emails?.[0]?.address ?? '';
    const username = email.split('@')[0] || 'user';

    await ChatPresence.upsertAsync(
      { roomId, connectionId: connId },
      { $set: { userId: this.userId, username, joinedAt: new Date() } },
    );

    this.onStop(async () => {
      await ChatPresence.removeAsync({ roomId, connectionId: connId });
    });

    return ChatPresence.find({ roomId });
  });

  Meteor.methods({
    async 'chat.sendMessage'(roomId: string, text: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const rid = roomIdSchema.parse(roomId);
      const result = chatMessageTextSchema.safeParse(text);
      if (!result.success)
        throw new Meteor.Error('validation', result.error.issues[0]?.message ?? 'Invalid input');
      const clean = result.data;
      const room = await ChatRooms.findOneAsync(rid);
      if (!room) throw new Meteor.Error('not-found', 'Room not found');
      const user = await Meteor.users.findOneAsync(this.userId);
      const email = user?.emails?.[0]?.address ?? '';
      const username = email.split('@')[0] || 'user';
      return ChatMessages.insertAsync({
        roomId: rid,
        userId: this.userId,
        username,
        text: clean,
        createdAt: new Date(),
      });
    },

    async 'chat.createRoom'(name: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const result = chatRoomNameSchema.safeParse(name);
      if (!result.success)
        throw new Meteor.Error('validation', result.error.issues[0]?.message ?? 'Invalid input');
      const clean = result.data;
      const existing = await ChatRooms.findOneAsync({ name: clean });
      if (existing) throw new Meteor.Error('conflict', `Room "${clean}" already exists`);
      return ChatRooms.insertAsync({ name: clean, createdAt: new Date(), createdBy: this.userId });
    },

    async 'chat.toggleReaction'(messageId: string, emoji: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const mid = messageIdSchema.parse(messageId);
      const validEmoji = reactionEmojiSchema.parse(emoji);

      const msg = await ChatMessages.findOneAsync(mid);
      if (!msg) throw new Meteor.Error('not-found', 'Message not found');

      const users = msg.reactions?.[validEmoji] ?? [];
      if (users.includes(this.userId)) {
        await ChatMessages.updateAsync(mid, {
          $pull: { [`reactions.${validEmoji}`]: this.userId },
        });
        // Remove the key entirely if the array is now empty
        const updated = await ChatMessages.findOneAsync(mid);
        if (updated?.reactions?.[validEmoji]?.length === 0) {
          await ChatMessages.updateAsync(mid, {
            $unset: { [`reactions.${validEmoji}`]: 1 },
          });
        }
      } else {
        await ChatMessages.updateAsync(mid, {
          $addToSet: { [`reactions.${validEmoji}`]: this.userId },
        });
      }
    },

    async 'chat.setTyping'(roomId: string, isTyping: boolean) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const rid = roomIdSchema.parse(roomId);
      if (isTyping) {
        const user = await Meteor.users.findOneAsync(this.userId);
        const email = user?.emails?.[0]?.address ?? '';
        const username = email.split('@')[0] || 'user';
        await ChatTyping.upsertAsync(
          { roomId: rid, userId: this.userId },
          { $set: { username, updatedAt: new Date() } },
        );
      } else {
        await ChatTyping.removeAsync({ roomId: rid, userId: this.userId });
      }
    },
  });
}
