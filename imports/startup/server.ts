import { Accounts } from 'meteor/accounts-base';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { Todos } from '../api/todos';

// Configure passwordless login (magic link) via email
// Basic sample configuration – in production set MAIL_URL env.
Accounts.config({
  loginExpirationInDays: 30,
});

// Publish minimal user fields for currently logged in user
Meteor.publish(null, function () {
  if (!this.userId) return this.ready();
  return Meteor.users.find({ _id: this.userId }, { fields: { emails: 1, createdAt: 1 } });
});

Meteor.startup(() => {
  // Ensure indexes (idempotent)
  const raw = Todos.rawCollection();
  // Create compound index for efficient user listing
  raw.createIndex?.({ userId: 1, createdAt: -1 }).catch(() => {});
  raw.createIndex?.({ userId: 1, done: 1 }).catch(() => {});

  // Rate limiting for todo methods (defense-in-depth)
  const METHODS = ['todos.insert', 'todos.toggle', 'todos.remove', 'todos.clearCompleted'];
  DDPRateLimiter.addRule(
    {
      name(name: string) {
        return METHODS.includes(name);
      },
      userId() {
        return true; // apply per-user
      },
    },
    30, // events
    10_000, // per 10 seconds
  );
});
