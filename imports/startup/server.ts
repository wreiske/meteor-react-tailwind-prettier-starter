import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

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
