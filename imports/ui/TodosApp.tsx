import {
  faCircle,
  faCircleCheck,
  faEraser,
  faList,
  faPlus,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React, { useMemo, useState } from 'react';

import { type TodoDoc, Todos } from '../api/todos';
import { Button } from './Button';
import { Input } from './Input';
import { ThemeToggle } from './ThemeToggle';
import { TodoItem } from './TodoItem';
import Tooltip from './Tooltip';

export const TodosApp: React.FC = () => {
  const todosSub = useTracker(() => Meteor.subscribe('todos.list'), []);
  const allTodos = useTracker<TodoDoc[]>(
    () => Todos.find({}, { sort: { createdAt: -1 } }).fetch(),
    [],
  );
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const todos = useMemo(() => {
    if (filter === 'active') return allTodos.filter((t) => !t.done);
    if (filter === 'completed') return allTodos.filter((t) => t.done);
    return allTodos;
  }, [allTodos, filter]);

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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 bg-neutral-50 px-4 py-10 font-sans text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Log out" placement="right">
            <button
              onClick={() => Meteor.logout()}
              aria-label="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-neutral-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-blue-400 dark:hover:bg-neutral-700/50"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </Tooltip>
        </div>
      </header>
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
          {todos.length === 0 && (
            <li className="p-4 text-sm text-neutral-500 dark:text-neutral-400">No todos yet.</li>
          )}
          {todos.map((t) => (
            <TodoItem key={t._id} todo={t} onToggle={toggleTodo} onRemove={removeTodo} />
          ))}
        </ul>
        {todosSub && !todosSub.ready() && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading todos…</p>
        )}
      </section>
      <footer className="mt-auto pt-4 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
        Meteor + React 19 + Tailwind Starter
      </footer>
    </div>
  );
};
