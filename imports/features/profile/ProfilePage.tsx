/**
 * ProfilePage — Public profile view + own-profile edit form.
 *
 * • Any authenticated user can view any profile by userId
 * • The profile owner sees an inline edit form (displayName, bio, website)
 * • Avatar, displayName, bio and website are the editable public fields
 *
 * Subscriptions: 'profile.public' for the viewed userId
 */
import { faGlobe, faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useState } from 'react';

import { UserProfiles } from './api';
import { Avatar } from './Avatar';

interface ProfilePageProps {
  userId: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
  const myId = useTracker(() => Meteor.userId(), []);
  const isOwn = myId === userId;

  const { profile, isReady } = useTracker(() => {
    const handle = Meteor.subscribe('profile.public', userId);
    return {
      profile: UserProfiles.findOne({ userId }),
      isReady: handle.ready(),
    };
  }, [userId]);

  const email = useTracker(() => {
    if (!isOwn) return null;
    const user = Meteor.user();
    return user?.emails?.[0]?.address ?? null;
  }, [isOwn]);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDisplayName(profile?.displayName ?? '');
    setBio(profile?.bio ?? '');
    setWebsite(profile?.website ?? '');
    setError('');
    setEditing(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    Meteor.call('profile.update', { displayName, bio, website }, (err: Meteor.Error | null) => {
      setSaving(false);
      if (err) {
        setError(err.reason ?? 'Error saving profile');
      } else {
        setEditing(false);
      }
    });
  };

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      </div>
    );
  }

  // Determine what to display: prefer saved displayName, then email, then fallback
  const nameText = profile?.displayName || email || 'Unknown user';
  // Seed the avatar colour from email (stable) or userId
  const avatarSeed = email ?? userId;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Profile header card */}
      <div className="flex items-start gap-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <Avatar seed={avatarSeed} label={nameText} size="lg" />

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{nameText}</h1>

          {isOwn && email && (
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{email}</p>
          )}

          {profile?.bio && (
            <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{profile.bio}</p>
          )}

          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              <FontAwesomeIcon icon={faGlobe} className="shrink-0" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}

          {isOwn && !profile?.displayName && !profile?.bio && !editing && (
            <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
              Your profile is empty. Click edit to add a display name and bio.
            </p>
          )}
        </div>

        {isOwn && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Edit profile"
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
          </button>
        )}
      </div>

      {/* Edit form — own profile only */}
      {isOwn && editing && (
        <form
          onSubmit={save}
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Profile
          </h2>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:text-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="A short bio…"
              className="w-full resize-none rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:text-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Website
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              maxLength={200}
              placeholder="https://yoursite.com"
              type="url"
              className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:text-neutral-100"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
