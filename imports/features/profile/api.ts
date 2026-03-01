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

import { profileUpdateSchema, type UserProfileDoc } from './schema';

export type { ProfileUpdateInput, UserProfileDoc } from './schema';

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
      const result = profileUpdateSchema.safeParse(fields);
      if (!result.success)
        throw new Meteor.Error('validation', result.error.issues[0]?.message ?? 'Invalid input');
      const { displayName, bio, website } = result.data;

      const now = new Date();
      await UserProfiles.upsertAsync(
        { userId: this.userId },
        {
          $set: { displayName, bio, website, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
      );
    },
  });
}
