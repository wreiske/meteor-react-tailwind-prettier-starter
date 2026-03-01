import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { useTheme } from '../lib/useTheme';
import Tooltip from './Tooltip';

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Tooltip content={label} placement="right" delay={140}>
      <button
        type="button"
        aria-label={label}
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="text-sm" />
      </button>
    </Tooltip>
  );
};
