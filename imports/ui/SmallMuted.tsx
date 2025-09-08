import React from 'react';

export const SmallMuted: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  ...props
}) => (
  <p
    {...props}
    className={`text-[11px] font-medium text-neutral-500 dark:text-neutral-400 ${className}`}
  />
);
