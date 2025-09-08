import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={`rounded-md font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${className}`}
  />
);
