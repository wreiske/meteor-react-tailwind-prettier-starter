/**
 * Profile feature — API (collection, publication, methods, indexes).
 *
 * Each user has one optional public profile document.
 * The profile is readable by any authenticated user, writable only by the owner.
 *
 * To disable: remove this import from server/main.ts and remove the route
 * entry from AppLayout.tsx.
 */
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// ─── Data model ──────────────────────────────────────────────────────────────

export interface UserProfileDoc {
  _id?: string;
  userId: string; // 1-to-1 with Meteor.users
  displayName: string; // chosen name shown in chat + profile page
  bio: string; // short free-text
  website: string; // optional URL
  createdAt: Date;
  updatedAt: Date;
}

export const UserProfiles = new Mongo.Collection<UserProfileDoc>('userProfiles');

// ─── Server ───────────────────────────────────────────────────────────────────

if (Meteor.isServer) {
  Meteor.startup(async () => {
    await UserProfiles.createIndexAsync({ userId: 1 }, { unique: true });

    DDPRateLimiter.addRule({ name: (n) => n === 'profile.update', userId: () => true }, 10, 60_000);
  });

  // Publish a single user's public profile by userId
  Meteor.publish('profile.public', function (userId: string) {
    if (!this.userId) return this.ready();
    check(userId, String);
    return UserProfiles.find({ userId });
  });

  // Publish multiple profiles by userId array (used by chat to resolve usernames)
  Meteor.publish('profile.byIds', function (userIds: string[]) {
    if (!this.userId) return this.ready();
    check(userIds, [String]);
    if (userIds.length === 0) return this.ready();
    const safeIds = userIds.slice(0, 200); // cap
    return UserProfiles.find({ userId: { $in: safeIds } });
  });

  Meteor.methods({
    async 'profile.update'(fields: { displayName?: string; bio?: string; website?: string }) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      check(fields, Object);

      const displayName = (fields.displayName ?? '').trim().slice(0, 50);
      const bio = (fields.bio ?? '').trim().slice(0, 300);
      const rawWebsite = (fields.website ?? '').trim().slice(0, 200);

      // Basic URL validation — must be empty or start with http(s)://
      if (rawWebsite && !/^https?:\/\/.+/.test(rawWebsite)) {
        throw new Meteor.Error('invalid-website', 'Website must start with http:// or https://');
      }

      const now = new Date();
      await UserProfiles.upsertAsync(
        { userId: this.userId },
        {
          $set: { displayName, bio, website: rawWebsite, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
      );
    },
  });
}
