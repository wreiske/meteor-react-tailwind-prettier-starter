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

// ─── Data model ──────────────────────────────────────────────────────────────

export interface ChatRoomDoc {
  _id?: string;
  name: string;
  createdAt: Date;
  createdBy: string; // userId or 'system'
}

export interface ChatMessageDoc {
  _id?: string;
  roomId: string;
  userId: string;
  username: string; // denormalized email prefix for fast display
  text: string;
  createdAt: Date;
}

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
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
    return ChatMessages.find({ roomId }, { sort: { createdAt: -1 }, limit: safeLimit });
  });

  Meteor.methods({
    async 'chat.sendMessage'(roomId: string, text: string) {
      check(roomId, String);
      check(text, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const clean = text.trim();
      if (!clean) throw new Meteor.Error('empty', 'Message cannot be empty');
      if (clean.length > 2000) throw new Meteor.Error('too-long', 'Keep it under 2000 chars');
      const room = await ChatRooms.findOneAsync(roomId);
      if (!room) throw new Meteor.Error('not-found', 'Room not found');
      const user = await Meteor.users.findOneAsync(this.userId);
      const email = user?.emails?.[0]?.address ?? '';
      const username = email.split('@')[0] || 'user';
      return ChatMessages.insertAsync({
        roomId,
        userId: this.userId,
        username,
        text: clean,
        createdAt: new Date(),
      });
    },

    async 'chat.createRoom'(name: string) {
      check(name, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const clean = name.trim().toLowerCase().replace(/\s+/g, '-');
      if (!clean) throw new Meteor.Error('empty', 'Room name required');
      if (clean.length > 50) throw new Meteor.Error('too-long', 'Keep it under 50 chars');
      if (!/^[a-z0-9-]+$/.test(clean))
        throw new Meteor.Error('invalid-name', 'Only letters, numbers, and hyphens allowed');
      const existing = await ChatRooms.findOneAsync({ name: clean });
      if (existing) throw new Meteor.Error('conflict', `Room "${clean}" already exists`);
      return ChatRooms.insertAsync({ name: clean, createdAt: new Date(), createdBy: this.userId });
    },
  });
}
