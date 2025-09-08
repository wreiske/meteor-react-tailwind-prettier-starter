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

Meteor.startup(async () => {
  // Ensure indexes (idempotent) using Meteor's createIndexAsync helper
  try {
    await Todos.createIndexAsync({ userId: 1, createdAt: -1 });
    await Todos.createIndexAsync({ userId: 1, done: 1 });
  } catch (e) {
    // Non-fatal – log verbosely only in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Index creation error', e);
    }
  }

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
