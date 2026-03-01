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
  type ChatRoomDoc,
  chatRoomNameSchema,
  messageLimitSchema,
  roomIdSchema,
} from './schema';

export type { ChatMessageDoc, ChatRoomDoc } from './schema';

export const ChatRooms = new Mongo.Collection<ChatRoomDoc>('chatRooms');
export const ChatMessages = new Mongo.Collection<ChatMessageDoc>('chatMessages');

// ─── Server ───────────────────────────────────────────────────────────────────

if (Meteor.isServer) {
  Meteor.startup(async () => {
    // Indexes
    await ChatMessages.createIndexAsync({ roomId: 1, createdAt: 1 });
    await ChatRooms.createIndexAsync({ createdAt: 1 });

    // Seed a default "general" room once
    const count = await ChatRooms.rawCollection().countDocuments();
    if (count === 0) {
      await ChatRooms.insertAsync({ name: 'general', createdAt: new Date(), createdBy: 'system' });
    }

    // Rate limiting
    const METHODS = ['chat.sendMessage', 'chat.createRoom'];
    DDPRateLimiter.addRule(
      {
        name: (n) => METHODS.includes(n),
        userId: () => true,
      },
      20,
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
  });
}
