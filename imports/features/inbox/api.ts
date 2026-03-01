/**
 * Dev Inbox — captures emails when MAIL_URL isn't configured.
 *
 * Gives developers a built-in way to read magic-link emails without
 * configuring SMTP. Access the inbox at /inbox?email=user@example.com
 *
 * To disable: remove the import from server/main.ts and the route
 * from client/main.tsx.
 */
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// ─── Data model ──────────────────────────────────────────────────────────────

export interface DevMailDoc {
  _id?: string;
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  sentAt: Date;
}

export const DevMails = new Mongo.Collection<DevMailDoc>('devMails');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract bare email from "Name <email>" or plain "email" format. */
export function extractEmailAddress(addr: string): string {
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1] : addr).trim().toLowerCase();
}

// ─── Server ───────────────────────────────────────────────────────────────────

if (Meteor.isServer) {
  Meteor.startup(async () => {
    const raw = DevMails.rawCollection();
    await raw.createIndex({ to: 1, sentAt: -1 });
    // Auto-expire dev mails after 5 minutes — drop first to allow TTL changes
    try {
      await raw.dropIndex('sentAt_1');
    } catch {
      // Index may not exist yet
    }
    await raw.createIndex({ sentAt: 1 }, { expireAfterSeconds: 300 });

    DDPRateLimiter.addRule({ name: (n) => n === 'inbox.clear', userId: () => true }, 5, 60_000);
  });

  // Publication — dev-mode only, no auth required (inbox is for local development)
  Meteor.publish('inbox.messages', function (email: unknown) {
    if (process.env.MAIL_URL) return this.ready();
    check(email, String);
    const normalized = (email as string).trim().toLowerCase();
    if (!normalized) return this.ready();
    return DevMails.find({ to: normalized }, { sort: { sentAt: -1 }, limit: 50 });
  });

  Meteor.methods({
    async 'inbox.clear'(email: unknown) {
      if (process.env.MAIL_URL) throw new Meteor.Error('not-available', 'Inbox is dev-only');
      check(email, String);
      const normalized = (email as string).trim().toLowerCase();
      await DevMails.removeAsync({ to: normalized });
    },
    'inbox.isDevMode'() {
      return !process.env.MAIL_URL;
    },
  });
}
