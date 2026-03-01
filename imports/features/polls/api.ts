/**
 * Polls feature — API (collections, publications, methods, indexes, rate-limiting).
 *
 * Real-time showcase: vote counts update live on every connected client the
 * instant someone votes — no page refresh needed. Open two tabs and vote to see it.
 *
 * To disable: remove this import from server/main.ts and remove the route
 * entry from AppLayout.tsx.
 */
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// ─── Data model ──────────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  text: string;
}

export interface PollDoc {
  _id?: string;
  userId: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  isOpen: boolean;
}

export interface VoteDoc {
  _id?: string;
  pollId: string;
  userId: string;
  optionId: string;
  createdAt: Date;
}

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
      check(question, String);
      check(optionTexts, [String]);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const q = question.trim();
      if (!q) throw new Meteor.Error('empty', 'Question required');
      if (q.length > 300) throw new Meteor.Error('too-long', 'Question too long (max 300)');
      if (optionTexts.length < 2 || optionTexts.length > 8)
        throw new Meteor.Error('invalid-options', '2–8 options required');
      const options: PollOption[] = optionTexts.map((text, i) => ({
        id: `opt_${i}`,
        text: text.trim(),
      }));
      if (options.some((o) => !o.text))
        throw new Meteor.Error('empty-option', 'All options must have text');
      return Polls.insertAsync({
        userId: this.userId,
        question: q,
        options,
        createdAt: new Date(),
        isOpen: true,
      });
    },

    async 'polls.vote'(pollId: string, optionId: string) {
      check(pollId, String);
      check(optionId, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const poll = await Polls.findOneAsync(pollId);
      if (!poll) throw new Meteor.Error('not-found', 'Poll not found');
      if (!poll.isOpen) throw new Meteor.Error('closed', 'This poll is closed');
      if (!poll.options.some((o) => o.id === optionId))
        throw new Meteor.Error('invalid-option', 'Invalid option');
      // Upsert so the user can change their vote
      await Votes.upsertAsync(
        { pollId, userId: this.userId },
        { $set: { optionId, createdAt: new Date() } },
      );
    },

    async 'polls.close'(pollId: string) {
      check(pollId, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const poll = await Polls.findOneAsync({ _id: pollId, userId: this.userId });
      if (!poll) throw new Meteor.Error('not-found', 'Poll not found or not yours');
      await Polls.updateAsync(pollId, { $set: { isOpen: false } });
    },

    async 'polls.remove'(pollId: string) {
      check(pollId, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      const poll = await Polls.findOneAsync({ _id: pollId, userId: this.userId });
      if (!poll) throw new Meteor.Error('not-found', 'Poll not found or not yours');
      await Polls.removeAsync(pollId);
      await Votes.removeAsync({ pollId });
    },
  });
}
