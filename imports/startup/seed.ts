/**
 * e2e/seed — Meteor method that seeds demo data for the logged-in user.
 *
 * Only registered when the ALLOW_E2E_SEED environment variable is set.
 * Used by Playwright screenshot tests to populate realistic content.
 */
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { ChatMessages, ChatRooms } from '../features/chat/api';
import { Polls, Votes } from '../features/polls/api';
import { Todos } from '../features/todos/api';

if (Meteor.isServer && Meteor.isDevelopment) {
  Meteor.methods({
    /**
     * Create (or find) a user by email and return a one-time login token.
     * Playwright calls this, then uses Meteor.loginWithToken on the client.
     */
    async 'e2e.loginToken'(email: string) {
      const normalized = email.trim().toLowerCase();
      let user = await Accounts.findUserByEmail(normalized);
      if (!user) {
        const userId = await Meteor.users.insertAsync({
          emails: [{ address: normalized, verified: true }],
          createdAt: new Date(),
        });
        user = await Meteor.users.findOneAsync(userId);
      }
      if (!user) throw new Meteor.Error('user-creation-failed');
      const stampedToken = Accounts._generateStampedLoginToken();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (Accounts as any)._insertLoginToken(user._id, stampedToken);
      return { userId: user._id, token: stampedToken.token };
    },
    async 'e2e.seed'() {
      if (!this.userId) throw new Meteor.Error('not-authorized');

      const user = await Meteor.users.findOneAsync(this.userId);
      const email = user?.emails?.[0]?.address ?? 'demo@example.com';
      const username = email.split('@')[0] || 'demo';

      // ── Cleanup previous seed data for idempotent re-runs ──
      await Todos.removeAsync({ userId: this.userId });
      await ChatMessages.removeAsync({});
      await ChatRooms.removeAsync({});
      await Votes.removeAsync({});
      await Polls.removeAsync({});

      // ── Todos ──
      {
        const todoItems = [
          { text: 'Set up Meteor project with React 19', done: true },
          { text: 'Configure Tailwind CSS 4', done: true },
          { text: 'Add passwordless authentication', done: true },
          { text: 'Build real-time chat feature', done: false },
          { text: 'Create live polls with animated bars', done: false },
          { text: 'Deploy to production', done: false },
        ];
        for (let i = 0; i < todoItems.length; i++) {
          await Todos.insertAsync({
            userId: this.userId,
            text: todoItems[i].text,
            done: todoItems[i].done,
            order: i + 1,
            createdAt: new Date(Date.now() - (todoItems.length - i) * 60_000),
          });
        }
      }

      // ── Seed users ──
      // Create a few fake users to make chat & polls look realistic.
      const seedUsers: { email: string; username: string; id?: string }[] = [
        { email: 'alice@demo.test', username: 'alice' },
        { email: 'bob@demo.test', username: 'bob' },
        { email: 'carol@demo.test', username: 'carol' },
      ];
      for (const su of seedUsers) {
        const u = await Accounts.findUserByEmail(su.email);
        if (!u) {
          su.id = await Meteor.users.insertAsync({
            emails: [{ address: su.email, verified: true }],
            createdAt: new Date(),
          });
        } else {
          su.id = u._id;
        }
      }

      // ── Chat rooms + messages ──
      const generalRoomId = await ChatRooms.insertAsync({
        name: 'general',
        createdAt: new Date(Date.now() - 3_600_000),
        createdBy: 'system',
      });

      // Seed additional rooms
      const extraRooms = ['dev', 'random', 'help'];
      for (const name of extraRooms) {
        await ChatRooms.insertAsync({
          name,
          createdAt: new Date(Date.now() - 1_800_000 + extraRooms.indexOf(name) * 60_000),
          createdBy: this.userId,
        });
      }

      {
        // Multi-user conversation — alternates between the logged-in user and seed users
        const conversation: {
          userId: string;
          username: string;
          text: string;
          offset: number;
        }[] = [
          {
            userId: seedUsers[0].id!,
            username: 'alice',
            text: 'Hey everyone! Just cloned the Meteor starter — looks amazing 🚀',
            offset: 600,
          },
          {
            userId: seedUsers[1].id!,
            username: 'bob',
            text: 'Welcome Alice! Yeah, the DDP sync is wild. Open two tabs and watch it.',
            offset: 540,
          },
          {
            userId: this.userId,
            username,
            text: 'Thanks! I set it up in under 5 minutes. Passwordless auth just works 🔑',
            offset: 480,
          },
          {
            userId: seedUsers[2].id!,
            username: 'carol',
            text: 'The Tailwind 4 dark mode is a nice touch too — toggle it in the header ↗',
            offset: 420,
          },
          {
            userId: seedUsers[0].id!,
            username: 'alice',
            text: 'Oh nice, I see it! The polls feature is fun — I voted for React obviously 😄',
            offset: 360,
          },
          {
            userId: seedUsers[1].id!,
            username: 'bob',
            text: 'Same! Have you tried the drag-to-reorder on the todos? Smooth.',
            offset: 300,
          },
          {
            userId: this.userId,
            username,
            text: 'Yeah the todos have real-time sync too. Changed order on one tab, instantly reflected on the other.',
            offset: 240,
          },
          {
            userId: seedUsers[2].id!,
            username: 'carol',
            text: 'The SSR + hydration is a great default for SEO. Landing page loads instantly.',
            offset: 180,
          },
          {
            userId: seedUsers[0].id!,
            username: 'alice',
            text: "Does this work with TypeScript strict mode? I'm pretty strict about that 😅",
            offset: 120,
          },
          {
            userId: seedUsers[1].id!,
            username: 'bob',
            text: '100% TypeScript strict. Zod validation on every method too. Solid DX.',
            offset: 60,
          },
        ];
        for (const msg of conversation) {
          await ChatMessages.insertAsync({
            roomId: generalRoomId,
            userId: msg.userId,
            username: msg.username,
            text: msg.text,
            createdAt: new Date(Date.now() - msg.offset * 1000),
          });
        }
      }

      // ── Polls ──
      {
        const pollId = await Polls.insertAsync({
          userId: this.userId,
          question: 'What is your favorite frontend framework?',
          options: [
            { id: 'opt_0', text: 'React' },
            { id: 'opt_1', text: 'Vue' },
            { id: 'opt_2', text: 'Svelte' },
            { id: 'opt_3', text: 'Angular' },
          ],
          createdAt: new Date(Date.now() - 600_000),
          isOpen: true,
        });

        // Votes from multiple users for realistic bars
        const frameworkVotes: { userId: string; optionId: string }[] = [
          { userId: this.userId, optionId: 'opt_0' },
          { userId: seedUsers[0].id!, optionId: 'opt_0' },
          { userId: seedUsers[1].id!, optionId: 'opt_2' },
          { userId: seedUsers[2].id!, optionId: 'opt_0' },
        ];
        for (const v of frameworkVotes) {
          await Votes.upsertAsync(
            { pollId, userId: v.userId },
            { $set: { optionId: v.optionId, createdAt: new Date() } },
          );
        }

        const deployPollId = await Polls.insertAsync({
          userId: seedUsers[0].id!,
          question: 'Best deployment platform for Meteor?',
          options: [
            { id: 'opt_0', text: 'Galaxy (Meteor Cloud)' },
            { id: 'opt_1', text: 'Railway' },
            { id: 'opt_2', text: 'Self-hosted Docker' },
          ],
          createdAt: new Date(Date.now() - 300_000),
          isOpen: true,
        });

        const deployVotes: { userId: string; optionId: string }[] = [
          { userId: this.userId, optionId: 'opt_0' },
          { userId: seedUsers[0].id!, optionId: 'opt_0' },
          { userId: seedUsers[1].id!, optionId: 'opt_1' },
          { userId: seedUsers[2].id!, optionId: 'opt_2' },
        ];
        for (const v of deployVotes) {
          await Votes.upsertAsync(
            { pollId: deployPollId, userId: v.userId },
            { $set: { optionId: v.optionId, createdAt: new Date() } },
          );
        }
      }
    },
  });
}
