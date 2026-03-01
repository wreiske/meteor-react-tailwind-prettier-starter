import {
  faCircle,
  faCircleCheck,
  faEraser,
  faList,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import Tooltip from '../../ui/Tooltip';
import { type TodoDoc, Todos } from './api';
import { TodoItem } from './TodoItem';

export const TodosApp: React.FC = () => {
  const initialFilter = (() => {
    if (typeof window === 'undefined') return 'all';
    const p = new URLSearchParams(window.location.search).get('filter');
    return p === 'active' || p === 'completed' ? p : 'all';
  })();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>(initialFilter);

  const { allTodos, isReady } = useTracker(() => {
    const handle = Meteor.subscribe(
      'todos.list',
      filter === 'all' ? undefined : { status: filter },
    );
    const docs = Todos.find({}, { sort: { order: 1, createdAt: -1 } }).fetch();
    return { allTodos: docs, isReady: handle.ready() };
  }, [filter]);

  const [newTodo, setNewTodo] = useState('');
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const todos = useMemo(() => {
    if (filter !== 'all') return allTodos;
    return dragIds
      ? (dragIds.map((id) => allTodos.find((t) => t._id === id)).filter(Boolean) as TodoDoc[])
      : allTodos;
  }, [allTodos, dragIds, filter]);

  // Keep URL in sync when filter changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (filter === 'all') url.searchParams.delete('filter');
    else url.searchParams.set('filter', filter);
    const newUrl = url.pathname + (url.search ? `?${url.searchParams.toString()}` : '') + url.hash;
    window.history.replaceState({}, '', newUrl);
  }, [filter]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    Meteor.call('todos.insert', newTodo, (err: unknown) => {
      if (!err) setNewTodo('');
      else console.error(err);
    });
  };
  const toggleTodo = (id: string) => Meteor.call('todos.toggle', id);
  const removeTodo = (id: string) => Meteor.call('todos.remove', id);
  const clearCompleted = () => Meteor.call('todos.clearCompleted');

  const beginDrag = (id: string) => {
    if (filter !== 'all') return;
    setDragIds(allTodos.map((t) => t._id!));
    setDraggingId(id);
  };
  const dragOver = (overId: string) => {
    if (!dragIds || draggingId === null || draggingId === overId) return;
    setDragIds((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const fromIdx = next.indexOf(draggingId);
      const toIdx = next.indexOf(overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggingId);
      return next;
    });
  };
  const endDrag = (cancel?: boolean) => {
    if (!dragIds || !draggingId) {
      setDragIds(null);
      setDraggingId(null);
      return;
    }
    const finalOrder = dragIds;
    setDragIds(null);
    setDraggingId(null);
    if (!cancel) Meteor.call('todos.reorder', finalOrder);
  };

  const touchDragOver = (clientY: number, clientX: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return;
    const li = el.closest('li[data-id]') as HTMLElement | null;
    if (!li) return;
    const overId = li.getAttribute('data-id');
    if (overId) dragOver(overId);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <section className="space-y-4">
        <form onSubmit={addTodo} className="flex gap-2" noValidate>
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo"
            className="flex-1 dark:bg-neutral-800"
            maxLength={200}
          />
          <Tooltip content="Add todo" placement="top">
            <Button
              type="submit"
              disabled={!newTodo.trim()}
              aria-label="Add todo"
              className="flex h-10 w-10 items-center justify-center bg-blue-600 p-0 text-white shadow hover:bg-blue-500 disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
          </Tooltip>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <strong>{allTodos.filter((t) => !t.done).length}</strong> open •{' '}
            <strong>{allTodos.filter((t) => t.done).length}</strong> done
          </span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Filter todos">
            {[
              { key: 'all', icon: faList, label: 'All todos' },
              { key: 'active', icon: faCircle, label: 'Active todos' },
              { key: 'completed', icon: faCircleCheck, label: 'Completed todos' },
            ].map(({ key, icon, label }) => (
              <Tooltip key={key} content={label} placement="top">
                <button
                  type="button"
                  role="radio"
                  aria-checked={filter === key}
                  onClick={() => setFilter(key as typeof filter)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50'
                  }`}
                  aria-label={label}
                >
                  <FontAwesomeIcon icon={icon} />
                  <span className="sr-only">{label}</span>
                </button>
              </Tooltip>
            ))}
          </div>
          <Tooltip content="Clear completed" placement="top">
            <button
              type="button"
              onClick={clearCompleted}
              disabled={allTodos.every((t) => !t.done)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200/60 disabled:opacity-40 dark:hover:bg-neutral-700/50"
              aria-label="Clear completed"
            >
              <FontAwesomeIcon icon={faEraser} />
            </button>
          </Tooltip>
        </div>
        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
          {isReady && todos.length === 0 && (
            <li className="p-4 text-sm text-neutral-500 dark:text-neutral-400">No todos yet.</li>
          )}
          {isReady &&
            todos.map((t) => (
              <TodoItem
                key={t._id}
                todo={t}
                onToggle={toggleTodo}
                onRemove={removeTodo}
                isDragging={draggingId === t._id}
                draggableProps={{
                  draggable: true,
                  onDragStart: (e) => {
                    if (filter !== 'all') return e.preventDefault();
                    e.dataTransfer.effectAllowed = 'move';
                    beginDrag(t._id!);
                  },
                  onDragOver: (e) => {
                    if (filter !== 'all') return;
                    e.preventDefault();
                    dragOver(t._id!);
                  },
                  onDrop: (e) => {
                    if (filter !== 'all') return;
                    e.preventDefault();
                    dragOver(t._id!);
                    endDrag(false);
                  },
                  onDragEnd: () => filter === 'all' && endDrag(false),
                  onTouchStart: (e) => {
                    if (filter !== 'all') return;
                    beginDrag(t._id!);
                    e.stopPropagation();
                  },
                  onTouchMove: (e) => {
                    if (!draggingId || filter !== 'all') return;
                    const touch = e.touches[0];
                    touchDragOver(touch.clientY, touch.clientX);
                    e.preventDefault();
                  },
                  onTouchEnd: () => filter === 'all' && endDrag(false),
                  onTouchCancel: () => filter === 'all' && endDrag(true),
                }}
              />
            ))}
        </ul>
        {isReady && todos.length > 0 && filter === 'all' && (
          <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">
            Tip: drag (or touch &amp; drag) items to reorder.
          </p>
        )}
        {!isReady && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading todos…</p>
        )}
      </section>
    </div>
  );
};
