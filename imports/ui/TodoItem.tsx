import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { type TodoDoc } from '../api/todos';
import Tooltip from './Tooltip';

interface TodoItemProps {
  todo: TodoDoc;
  onToggle(id: string): void;
  onRemove(id: string): void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onRemove }) => (
  <li
    className="group relative flex items-center gap-3 bg-white px-4 py-2 text-sm dark:bg-neutral-800"
    data-id={todo._id}
  >
    <button
      onClick={() => onToggle(todo._id!)}
      className={`h-5 w-5 rounded border text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${todo.done ? 'border-green-600 bg-green-600 text-white' : 'border-neutral-400 text-neutral-400 hover:border-blue-500 hover:text-blue-500 dark:border-neutral-500'}`}
      aria-pressed={todo.done}
      aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
    >
      {todo.done ? '✓' : ''}
    </button>
    <span
      className={`flex-1 break-words ${todo.done ? 'text-neutral-400 line-through dark:text-neutral-500' : ''}`}
    >
      {todo.text}
    </span>
    <Tooltip content="Delete todo" placement="top">
      <button
        onClick={() => onRemove(todo._id!)}
        className="opacity-0 text-neutral-400 transition-opacity hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
        aria-label="Delete todo"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </Tooltip>
  </li>
);
