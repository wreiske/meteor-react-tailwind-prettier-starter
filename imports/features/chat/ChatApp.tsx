/**
 * ChatApp — Real-time multi-room chat.
 *
 * Meteor real-time showcase: messages delivered to every connected client
 * over DDP the instant they are inserted — no polling, no websocket boilerplate.
 * Open two browser tabs and send a message to see DDP in action.
 */
import { faHashtag, faPaperPlane, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useRef, useState } from 'react';

import { CHAT_MESSAGE_MAX, CHAT_ROOM_NAME_MAX } from '../../lib/constants';
import { useMethod } from '../../lib/useMethod';
import { Input } from '../../ui/Input';
import { useRouter } from '../../ui/router';
import { Tooltip } from '../../ui/Tooltip';
import { UserProfiles } from '../profile/api';
import { Avatar } from '../profile/Avatar';
import { UsernameBadge } from '../profile/UsernameBadge';
import { ChatMessages, ChatPresence, ChatRooms, ChatTyping } from './api';
import {
  type ChatMessageDoc,
  type ChatPresenceDoc,
  type ChatRoomDoc,
  type ChatTypingDoc,
  REACTION_EMOJIS,
} from './schema';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Group consecutive messages from the same user */
interface MessageGroup {
  userId: string;
  username: string;
  date: Date;
  messages: ChatMessageDoc[];
}

function groupMessages(messages: ChatMessageDoc[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    const sameUser = last && last.userId === msg.userId;
    // Start a new group after 5 minutes of silence from the same user
    const withinWindow = last && msg.createdAt.getTime() - last.date.getTime() < 5 * 60 * 1000;
    if (sameUser && withinWindow) {
      last.messages.push(msg);
      last.date = msg.createdAt;
    } else {
      groups.push({
        userId: msg.userId,
        username: msg.username,
        date: msg.createdAt,
        messages: [msg],
      });
    }
  }
  return groups;
}

function avatarColor(username: string): string {
  const colors = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-green-600',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── ReactionPicker ──────────────────────────────────────────────────────────

const ReactionPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => (
  <div className="flex gap-0.5 rounded-lg border border-neutral-200 bg-white px-1 py-0.5 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
    {REACTION_EMOJIS.map((emoji) => (
      <button
        key={emoji}
        type="button"
        onClick={() => onSelect(emoji)}
        className="rounded p-1 text-sm transition-transform hover:scale-125 hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        {emoji}
      </button>
    ))}
  </div>
);

// ─── ReactionBar ─────────────────────────────────────────────────────────────

const ReactionBar: React.FC<{
  reactions: Record<string, string[]>;
  currentUserId: string;
  onToggle: (emoji: string) => void;
}> = ({ reactions, currentUserId, onToggle }) => {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  const allUids = entries.flatMap(([, uids]) => uids);

  const nameMap = useTracker(() => {
    const m: Record<string, string> = {};
    for (const uid of allUids) {
      const p = UserProfiles.findOne({ userId: uid });
      if (p?.displayName) m[uid] = p.displayName;
    }
    return m;
  }, [allUids.join(',')]);

  if (entries.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.map(([emoji, userIds]) => {
        const hasReacted = userIds.includes(currentUserId);
        const names = userIds.map((uid) => nameMap[uid] || uid.slice(0, 8));
        const tip =
          names.length <= 5
            ? names.join(', ')
            : `${names.slice(0, 4).join(', ')} +${names.length - 4}`;
        return (
          <Tooltip key={emoji} content={tip}>
            <button
              type="button"
              onClick={() => onToggle(emoji)}
              className={[
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                hasReacted
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-neutral-700',
              ].join(' ')}
            >
              <span>{emoji}</span>
              <span className="font-medium">{userIds.length}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

// ─── TypingIndicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC<{ typers: ChatTypingDoc[] }> = ({ typers }) => {
  const names = useTracker(() => {
    return typers.map((t) => {
      const profile = UserProfiles.findOne({ userId: t.userId });
      return profile?.displayName || t.username;
    });
  }, [typers]);

  if (names.length === 0) return null;

  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    const others = names.length - 2;
    text = `${names[0]}, ${names[1]}, and ${others} ${others === 1 ? 'other' : 'others'} are typing`;
  }

  return (
    <div className="flex h-6 shrink-0 items-center gap-1.5 px-4 text-xs text-neutral-400 dark:text-neutral-500">
      <span className="inline-flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-current"
            style={{
              animation: 'typing-dot 1.4s infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </span>
      <span>{text}</span>
    </div>
  );
};

// ─── UserList ────────────────────────────────────────────────────────────────

const UserList: React.FC<{ presence: ChatPresenceDoc[] }> = ({ presence }) => {
  const { navigate } = useRouter();

  const users = useTracker(() => {
    const seen = new Set<string>();
    return presence
      .filter((p) => {
        if (seen.has(p.userId)) return false;
        seen.add(p.userId);
        return true;
      })
      .map((p) => {
        const profile = UserProfiles.findOne({ userId: p.userId });
        return {
          userId: p.userId,
          displayName: profile?.displayName || p.username,
          seed: p.username,
        };
      });
  }, [presence]);

  return (
    <aside className="hidden w-48 shrink-0 flex-col border-l border-neutral-200 bg-neutral-50 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-12 items-center px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Online &mdash; {users.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {users.map((u) => (
          <button
            key={u.userId}
            type="button"
            onClick={() => navigate(`/app/profile/${u.userId}`)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <div className="relative">
              <Avatar seed={u.seed} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-neutral-50 bg-green-500 dark:border-neutral-900" />
            </div>
            <span className="truncate text-sm text-neutral-700 dark:text-neutral-300">
              {u.displayName}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};

// ─── RoomList ─────────────────────────────────────────────────────────────────

interface RoomListProps {
  rooms: ChatRoomDoc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, selectedId, onSelect }) => {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const createRoom = useMethod<[string], string>('chat.createRoom');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createRoom
      .call(newName)
      .then((id) => {
        setNewName('');
        setCreating(false);
        onSelect(id);
      })
      .catch(() => {}); // error is in createRoom.error
  };

  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-12 items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Rooms
        </span>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            createRoom.clearError();
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
          title="New room"
          aria-label="Create room"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
        </button>
      </div>

      {creating && (
        <form onSubmit={submit} className="px-2 pb-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="room-name"
            className="h-7 text-xs"
            maxLength={CHAT_ROOM_NAME_MAX}
          />
          {createRoom.error && <p className="mt-1 text-[10px] text-red-500">{createRoom.error}</p>}
        </form>
      )}

      <nav className="flex-1 overflow-y-auto px-1 pb-2">
        {rooms.map((room) => (
          <button
            key={room._id}
            type="button"
            onClick={() => onSelect(room._id!)}
            className={[
              'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              room._id === selectedId
                ? 'bg-blue-100 font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-400 dark:hover:bg-neutral-800',
            ].join(' ')}
          >
            <FontAwesomeIcon icon={faHashtag} className="shrink-0 text-[10px] opacity-60" />
            <span className="truncate">{room.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

// ─── MessageList ─────────────────────────────────────────────────────────────

interface MessageListProps {
  messages: ChatMessageDoc[];
  isReady: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isReady }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sorted = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const groups = groupMessages(sorted);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          No messages yet. Say hello! 👋
        </p>
      </div>
    );
  }

  let lastDateLabel = '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {groups.map((group, gi) => {
        const dateLabel = formatDate(group.messages[0].createdAt);
        const showDateLabel = dateLabel !== lastDateLabel;
        if (showDateLabel) lastDateLabel = dateLabel;
        return (
          <React.Fragment key={`${group.userId}-${gi}`}>
            {showDateLabel && (
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              </div>
            )}
            <div className="mb-3 flex gap-3">
              {/* Avatar */}
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(group.username)}`}
                aria-hidden
              >
                {group.username[0]?.toUpperCase()}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <UsernameBadge userId={group.userId} username={group.username} />
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {formatTime(group.messages[0].createdAt)}
                  </span>
                </div>
                {group.messages.map((msg) => (
                  <div key={msg._id} className="group/msg relative -mx-1 rounded px-1 py-0.5">
                    <div className="pointer-events-none absolute -top-3 right-0 z-10 opacity-0 transition-opacity group-hover/msg:pointer-events-auto group-hover/msg:opacity-100">
                      <ReactionPicker
                        onSelect={(emoji) => Meteor.call('chat.toggleReaction', msg._id, emoji)}
                      />
                    </div>
                    <p className="break-words text-sm text-neutral-800 dark:text-neutral-200">
                      {msg.text}
                    </p>
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <ReactionBar
                        reactions={msg.reactions}
                        currentUserId={Meteor.userId() ?? ''}
                        onToggle={(emoji) => Meteor.call('chat.toggleReaction', msg._id, emoji)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

// ─── MessageInput ─────────────────────────────────────────────────────────────

interface MessageInputProps {
  roomId: string;
  roomName: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId, roomName }) => {
  const [text, setText] = useState('');
  const sendMessage = useMethod<[string, string]>('chat.sendMessage');
  const typingTimeout = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const setTyping = (typing: boolean) => {
    if (typing !== isTypingRef.current) {
      isTypingRef.current = typing;
      Meteor.call('chat.setTyping', roomId, typing);
    }
  };

  const handleTyping = () => {
    setTyping(true);
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => setTyping(false), 3_000);
  };

  // Clean up typing state on unmount or room change
  useEffect(() => {
    return () => {
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      if (isTypingRef.current) {
        Meteor.call('chat.setTyping', roomId, false);
        isTypingRef.current = false;
      }
    };
  }, [roomId]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text;
    setText('');
    setTyping(false);
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    sendMessage.call(roomId, msg);
  };

  return (
    <form
      onSubmit={send}
      className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
    >
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value.trim()) handleTyping();
          else setTyping(false);
        }}
        placeholder={`Message #${roomName}`}
        className="flex-1 dark:bg-neutral-800"
        maxLength={CHAT_MESSAGE_MAX}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(e);
          }
        }}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
        aria-label="Send message"
      >
        <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
      </button>
    </form>
  );
};

// ─── ChatApp ─────────────────────────────────────────────────────────────────

export const ChatApp: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const { rooms, roomsReady } = useTracker(() => {
    const handle = Meteor.subscribe('chat.rooms');
    return {
      rooms: ChatRooms.find({}, { sort: { createdAt: 1 } }).fetch(),
      roomsReady: handle.ready(),
    };
  }, []);

  // Auto-select first room when rooms load
  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0]._id!);
    }
  }, [rooms, selectedRoomId]);

  const { messages, messagesReady } = useTracker(() => {
    if (!selectedRoomId) return { messages: [], messagesReady: false };
    const handle = Meteor.subscribe('chat.messages', selectedRoomId, 100);
    const msgs = ChatMessages.find({ roomId: selectedRoomId }).fetch();
    // Subscribe to profiles for every message author + reactor so tooltips resolve displayNames
    const uidSet = new Set(msgs.map((m) => m.userId));
    msgs.forEach((m) => {
      if (m.reactions) {
        Object.values(m.reactions).forEach((uids) => uids.forEach((uid) => uidSet.add(uid)));
      }
    });
    const uids = [...uidSet];
    if (uids.length > 0) Meteor.subscribe('profile.byIds', uids);
    return {
      messages: msgs,
      messagesReady: handle.ready(),
    };
  }, [selectedRoomId]);

  // Typing indicators
  const typers = useTracker(() => {
    if (!selectedRoomId) return [];
    Meteor.subscribe('chat.typing', selectedRoomId);
    return ChatTyping.find({ roomId: selectedRoomId }).fetch();
  }, [selectedRoomId]);

  // Online presence
  const presence = useTracker(() => {
    if (!selectedRoomId) return [];
    Meteor.subscribe('chat.presence', selectedRoomId);
    const all = ChatPresence.find({ roomId: selectedRoomId }).fetch();
    // Subscribe to profiles for online users
    const pUids = [...new Set(all.map((p) => p.userId))];
    if (pUids.length > 0) Meteor.subscribe('profile.byIds', pUids);
    return all;
  }, [selectedRoomId]);

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

  return (
    // h-full fills the <main> flex-1 area in AppLayout
    <div className="flex h-full">
      <RoomList rooms={rooms} selectedId={selectedRoomId} onSelect={setSelectedRoomId} />

      {/* Message panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Channel header */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
          {selectedRoom ? (
            <>
              <FontAwesomeIcon
                icon={faHashtag}
                className="text-sm text-neutral-400 dark:text-neutral-500"
              />
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {selectedRoom.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-neutral-400 dark:text-neutral-500">
              {roomsReady ? 'Select a room' : 'Loading…'}
            </span>
          )}
        </div>

        {selectedRoom ? (
          // overflow-hidden is required for the inner flex-1 overflow-y-auto MessageList
          // to be correctly bounded within this flex column
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <MessageList messages={messages} isReady={messagesReady} />
              <TypingIndicator typers={typers} />
              <MessageInput roomId={selectedRoom._id!} roomName={selectedRoom.name} />
            </div>
            <UserList presence={presence} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              {roomsReady ? 'Select or create a room to start chatting.' : 'Loading rooms…'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
