/**
 * UsernameBadge — Clickable username used in chat message groups.
 *
 * Reads the sender's UserProfile from the local mini-mongo collection (populated
 * by the parent ChatApp via the 'profile.byIds' subscription) and shows the
 * displayName if one exists, falling back to the stored `username`.
 *
 * Clicking navigates to /app/profile/:userId.
 */
import { useTracker } from 'meteor/react-meteor-data';
import React from 'react';

import { useRouter } from '../../ui/router';
import { UserProfiles } from './api';

interface UsernameBadgeProps {
  userId: string;
  /** Fallback display if no UserProfile document exists yet */
  username: string;
}

export const UsernameBadge: React.FC<UsernameBadgeProps> = ({ userId, username }) => {
  const { navigate } = useRouter();
  const profile = useTracker(() => UserProfiles.findOne({ userId }), [userId]);
  const displayName = profile?.displayName || username;

  return (
    <button
      type="button"
      onClick={() => navigate(`/app/profile/${userId}`)}
      className="text-sm font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
    >
      {displayName}
    </button>
  );
};
