import { Accounts } from 'meteor/accounts-base';
import { Email } from 'meteor/email';
import { Meteor } from 'meteor/meteor';

import { DevMails, extractEmailAddress } from '../features/inbox/api';

// Configure passwordless login (magic link) via email
// Basic sample configuration – in production set MAIL_URL env.
Accounts.config({
  loginExpirationInDays: 30,
});

// ── Dev inbox: capture emails when MAIL_URL is not configured ─────────────────
// Instead of failing silently or only logging to the console, we store
// intercepted emails in a Mongo collection so developers can read them
// at /inbox?email=user@example.com.
if (!process.env.MAIL_URL) {
  Email.hookSend((options) => {
    const to = 'to' in options ? options.to : undefined;
    if (!to) return false;
    const toList = Array.isArray(to) ? to : [to];
    const subject = 'subject' in options ? (options.subject as string) : '(no subject)';
    const text = 'text' in options ? (options.text as string | undefined) : undefined;
    const html = 'html' in options ? (options.html as string | undefined) : undefined;
    const from = 'from' in options ? (options.from as string) : 'noreply@localhost';
    for (const raw of toList) {
      const addr = typeof raw === 'string' ? raw : raw?.address || '';
      const email = extractEmailAddress(addr);
      if (!email) continue;
      DevMails.insertAsync({
        to: email,
        from: from || 'noreply@localhost',
        subject: subject || '(no subject)',
        text,
        html,
        sentAt: new Date(),
      }).catch((err: unknown) => {
        console.error('[Dev Inbox] Failed to store email:', err);
      });
    }
    console.log(`[Dev Inbox] Email captured for ${toList.join(', ')}: ${subject}`);
    return false; // Prevent default send (no SMTP configured)
  });
}

// Publish minimal user fields for currently logged in user
Meteor.publish(null, function () {
  if (!this.userId) return this.ready();
  return Meteor.users.find({ _id: this.userId }, { fields: { emails: 1, createdAt: 1 } });
});
