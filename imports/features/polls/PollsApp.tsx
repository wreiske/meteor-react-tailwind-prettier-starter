/**
 * PollsApp — Live voting with real-time results.
 *
 * Meteor real-time showcase: vote counts update on every connected client
 * the moment anyone votes. Open two browser windows and vote to see DDP
 * reactive data sync in action — zero polling, zero manual refresh.
 */
import {
  faChartBar,
  faCheck,
  faLock,
  faPlus,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useState } from 'react';

import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { type PollDoc, Polls, type VoteDoc, Votes } from './api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVoteCounts(poll: PollDoc, votes: VoteDoc[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const opt of poll.options) counts[opt.id] = 0;
  for (const v of votes) {
    if (v.pollId === poll._id) counts[v.optionId] = (counts[v.optionId] ?? 0) + 1;
  }
  return counts;
}

// ─── CreatePollForm ───────────────────────────────────────────────────────────

interface CreateFormProps {
  onClose: () => void;
}

const CreatePollForm: React.FC<CreateFormProps> = ({ onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setOption = (i: number, val: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));

  const addOption = () => {
    if (options.length < 8) setOptions((prev) => [...prev, '']);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const filled = options.filter((o) => o.trim());
    if (!question.trim()) return setError('Question is required.');
    if (filled.length < 2) return setError('At least 2 non-empty options required.');
    setSubmitting(true);
    Meteor.call('polls.create', question, filled, (err: Meteor.Error | null) => {
      setSubmitting(false);
      if (err) setError(err.reason ?? 'Error creating poll');
      else onClose();
    });
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">New Poll</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          aria-label="Cancel"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Question
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we build next?"
            maxLength={300}
            className="w-full dark:bg-neutral-700"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Options
          </label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                maxLength={100}
                className="flex-1 dark:bg-neutral-700"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-neutral-400 hover:text-red-500"
                  aria-label="Remove option"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
              Add option
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {submitting ? 'Creating…' : 'Create Poll'}
        </Button>
      </form>
    </div>
  );
};

// ─── PollCard ─────────────────────────────────────────────────────────────────

interface PollCardProps {
  poll: PollDoc;
  votes: VoteDoc[];
  currentUserId: string;
}

const PollCard: React.FC<PollCardProps> = ({ poll, votes, currentUserId }) => {
  const counts = getVoteCounts(poll, votes);
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);
  const myVote = votes.find((v) => v.pollId === poll._id && v.userId === currentUserId);
  const isOwner = poll.userId === currentUserId;

  const vote = (optionId: string) => {
    if (!poll.isOpen) return;
    Meteor.call('polls.vote', poll._id, optionId, (err: unknown) => {
      if (err) console.error(err);
    });
  };

  const close = () =>
    Meteor.call('polls.close', poll._id, (err: unknown) => {
      if (err) console.error(err);
    });

  const remove = () =>
    Meteor.call('polls.remove', poll._id, (err: unknown) => {
      if (err) console.error(err);
    });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      {/* Header */}
      <div className="mb-3 flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {poll.question}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {!poll.isOpen && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
              <FontAwesomeIcon icon={faLock} className="text-[8px]" />
              Closed
            </span>
          )}
          {isOwner && poll.isOpen && (
            <button
              type="button"
              onClick={close}
              className="text-[11px] text-neutral-400 hover:text-amber-600"
              title="Close poll"
              aria-label="Close poll"
            >
              <FontAwesomeIcon icon={faLock} />
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={remove}
              className="text-[11px] text-neutral-400 hover:text-red-500"
              title="Delete poll"
              aria-label="Delete poll"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const count = counts[opt.id] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const selected = myVote?.optionId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => vote(opt.id)}
              disabled={!poll.isOpen}
              className={[
                'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-default',
                selected
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50',
              ].join(' ')}
            >
              {/* Progress bar fill */}
              <div
                className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                  selected
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : 'bg-neutral-100 dark:bg-neutral-700/40'
                }`}
                style={{ width: `${pct}%` }}
                aria-hidden
              />
              {/* Label row */}
              <div className="relative flex items-center justify-between gap-2">
                <span
                  className={
                    selected
                      ? 'font-medium text-blue-700 dark:text-blue-300'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }
                >
                  {opt.text}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {selected && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-[10px] text-blue-600 dark:text-blue-400"
                    />
                  )}
                  <span className="font-medium">{pct}%</span>
                  <span className="text-neutral-400 dark:text-neutral-500">({count})</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {poll.isOpen && !myVote ? ' · Click an option to vote' : ''}
        {poll.isOpen && myVote ? ' · Click another option to change your vote' : ''}
      </p>
    </div>
  );
};

// ─── PollsApp ─────────────────────────────────────────────────────────────────

export const PollsApp: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);

  const { polls, votes, isReady, currentUserId } = useTracker(() => {
    const pollHandle = Meteor.subscribe('polls.list');
    const voteHandle = Meteor.subscribe('polls.votes');
    return {
      polls: Polls.find({}, { sort: { createdAt: -1 } }).fetch(),
      votes: Votes.find({}).fetch(),
      isReady: pollHandle.ready() && voteHandle.ready(),
      currentUserId: Meteor.userId() ?? '',
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <FontAwesomeIcon icon={faChartBar} />
          <span className="text-sm font-medium">
            {isReady ? `${polls.length} poll${polls.length !== 1 ? 's' : ''}` : 'Loading…'}
          </span>
        </div>
        <Button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
        >
          <FontAwesomeIcon icon={showCreate ? faXmark : faPlus} />
          {showCreate ? 'Cancel' : 'New Poll'}
        </Button>
      </div>

      {showCreate && <CreatePollForm onClose={() => setShowCreate(false)} />}

      {isReady && polls.length === 0 && !showCreate && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
          <FontAwesomeIcon
            icon={faChartBar}
            className="mb-3 text-3xl text-neutral-300 dark:text-neutral-600"
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No polls yet. Create the first one!
          </p>
        </div>
      )}

      {polls.map((poll) => (
        <PollCard key={poll._id} poll={poll} votes={votes} currentUserId={currentUserId} />
      ))}
    </div>
  );
};
