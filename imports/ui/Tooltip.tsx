import React, {
  cloneElement,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'right';
  delay?: number;
  hideDelay?: number;
  disableAnimation?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 120,
  hideDelay = 60,
  disableAnimation,
  open: controlledOpen,
  onOpenChange,
  className,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const showTimeout = useRef<number | null>(null);
  const hideTimeout = useRef<number | null>(null);
  const id = useId();
  const reducedMotion = usePrefersReducedMotion();

  const clearTimers = () => {
    if (showTimeout.current) window.clearTimeout(showTimeout.current);
    if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    showTimeout.current = null;
    hideTimeout.current = null;
  };

  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  const handleShow = () => {
    clearTimers();
    showTimeout.current = window.setTimeout(() => setOpen(true), delay);
  };
  const handleHide = () => {
    clearTimers();
    hideTimeout.current = window.setTimeout(() => setOpen(false), hideDelay);
  };

  useEffect(() => clearTimers, []);

  // Safe access to original handlers
  type ChildProps = Record<string, unknown> & {
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
  };
  const childProps = (children as ReactElement<ChildProps>).props;
  const triggerProps = {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: (e: React.MouseEvent) => {
      childProps.onMouseEnter?.(e);
      handleShow();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      childProps.onMouseLeave?.(e);
      handleHide();
    },
    onFocus: (e: React.FocusEvent) => {
      childProps.onFocus?.(e);
      handleShow();
    },
    onBlur: (e: React.FocusEvent) => {
      childProps.onBlur?.(e);
      handleHide();
    },
  };

  const motionOff = disableAnimation || reducedMotion;

  // Tailwind utility classes (no global CSS dependency)
  const base = [
    'absolute select-none pointer-events-none whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium',
    'bg-black/80 text-white shadow-lg backdrop-blur-sm dark:bg-white/15 dark:text-neutral-100',
    'transition duration-150 ease-out will-change-transform',
    motionOff ? '' : 'transform',
    'z-50',
  ];

  const stateClosed = motionOff ? 'opacity-0' : 'opacity-0 scale-95';
  const stateOpen = motionOff ? 'opacity-100' : 'opacity-100 scale-100';

  let placementClassesClosed = '';
  let placementClassesOpen = '';
  if (placement === 'top') {
    placementClassesClosed = [
      'left-1/2 bottom-full mb-1 -translate-x-1/2',
      motionOff ? '' : '-translate-y-0.5',
    ].join(' ');
    placementClassesOpen = [
      'left-1/2 bottom-full mb-1 -translate-x-1/2',
      motionOff ? '' : '-translate-y-1',
    ].join(' ');
  } else if (placement === 'right') {
    placementClassesClosed = [
      'left-full top-1/2 ml-2 -translate-y-1/2',
      motionOff ? '' : 'translate-x-0',
    ].join(' ');
    placementClassesOpen = [
      'left-full top-1/2 ml-2 -translate-y-1/2',
      motionOff ? '' : 'translate-x-1',
    ].join(' ');
  }

  return (
    <span className={['relative inline-flex', className].filter(Boolean).join(' ')}>
      {cloneElement(children, triggerProps)}
      <span
        role="tooltip"
        id={id}
        className={[
          ...base,
          open ? stateOpen : stateClosed,
          open ? placementClassesOpen : placementClassesClosed,
        ].join(' ')}
        aria-hidden={!open}
      >
        {content}
      </span>
    </span>
  );
};

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setPrefers(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefers;
}

export default Tooltip;
