import './styles.css';
import '../imports/startup/client';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import { LoginForm } from '../imports/ui/LoginForm';
import { TodosApp } from '../imports/ui/TodosApp';

const App: React.FC = () => {
  const user = useTracker(() => Meteor.user());
  const loggingIn = useTracker(() => Meteor.loggingIn());
  if (loggingIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Loading…</p>
      </div>
    );
  }
  if (!user) return <LoginForm />;
  return <TodosApp />;
};

let root: Root | undefined;
Meteor.startup(() => {
  const el = document.getElementById('root');
  if (!el) return;
  if (!root) root = createRoot(el);
  root.render(<App />);
});
