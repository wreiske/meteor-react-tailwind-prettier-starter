/**
 * Polls feature — API (collections, publications, methods, indexes, rate-limiting).
 *
 * Real-time showcase: vote counts update live on every connected client the
 * instant someone votes — no page refresh needed. Open two tabs and vote to see it.
 *
 * To disable: remove this import from server/main.ts and remove the route
 * entry from AppLayout.tsx.
 */
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import {
  optionIdSchema,
  type PollDoc,
  pollIdSchema,
  type PollOption,
  pollOptionTextsSchema,
  pollQuestionSchema,
  type VoteDoc,
} from './schema';

export type { PollDoc, PollOption, VoteDoc } from './schema';

export const Polls = new Mongo.Collection<PollDoc>('polls');
export const Votes = new Mongo.Collection<VoteDoc>('votes');

// ─── Server ───────────────────────────────────────────────────────────────────

if (Meteor.isServer) {
  Meteor.startup(async () => {
    // Indexes
    await Polls.createIndexAsync({ createdAt: -1 });
    await Votes.createIndexAsync({ pollId: 1, userId: 1 }, { unique: true });
    await Votes.createIndexAsync({ pollId: 1, optionId: 1 });

    // Rate limiting
    const METHODS = ['polls.create', 'polls.vote', 'polls.close', 'polls.remove'];
    DDPRateLimiter.addRule(
      {
        name: (n) => METHODS.includes(n),
        userId: () => true,
      },
      20,
      10_000,
    );
  });

  // Publish all polls (most recent first)
  Meteor.publish('polls.list', function () {
    if (!this.userId) return this.ready();
    return Polls.find({}, { sort: { createdAt: -1 } });
  });

  // Publish all votes (clients compute per-poll tallies reactively)
  Meteor.publish('polls.votes', function () {
    if (!this.userId) return this.ready();
    return Votes.find({});
  });

  Meteor.methods({
    async 'polls.create'(question: string, optionTexts: string[]) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const qResult = pollQuestionSchema.safeParse(question);
      if (!qResult.success)
        throw new Meteor.Error('validation', qResult.error.issues[0]?.message ?? 'Invalid input');
      const oResult = pollOptionTextsSchema.safeParse(optionTexts);
      if (!oResult.success)
        throw new Meteor.Error('validation', oResult.error.issues[0]?.message ?? 'Invalid input');
      const q = qResult.data;
      const options: PollOption[] = oResult.data.map((text, i) => ({
        id: `opt_${i}`,
        text,
      }));
      return Polls.insertAsync({
        userId: this.userId,
        question: q,
        options,
        createdAt: new Date(),
        isOpen: true,
      });
    },

    async 'polls.vote'(pollId: string, optionId: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const pid = pollIdSchema.parse(pollId);
      const oid = optionIdSchema.parse(optionId);
      const poll = await Polls.findOneAsync(pid);
      if (!poll) throw new Meteor.Error('not-found', 'Poll not found');
      if (!poll.isOpen) throw new Meteor.Error('closed', 'This poll is closed');
      if (!poll.options.some((o) => o.id === oid))
        throw new Meteor.Error('invalid-option', 'Invalid option');
      // Upsert so the user can change their vote
      await Votes.upsertAsync(
        { pollId: pid, userId: this.userId },
        { $set: { optionId: oid, createdAt: new Date() } },
      );
    },

    async 'polls.close'(pollId: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const pid = pollIdSchema.parse(pollId);
      const poll = await Polls.findOneAsync({ _id: pid, userId: this.userId });
      if (!poll) throw new Meteor.Error('not-found', 'Poll not found or not yours');
      await Polls.updateAsync(pid, { $set: { isOpen: false } });
    },

    async 'polls.remove'(pollId: string) {
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const pid = pollIdSchema.parse(pollId);
      const poll = await Polls.findOneAsync({ _id: pid, userId: this.userId });
      if (!poll) throw new Meteor.Error('not-found', 'Poll not found or not yours');
      await Polls.removeAsync(pid);
      await Votes.removeAsync({ pollId: pid });
    },
  });
}
