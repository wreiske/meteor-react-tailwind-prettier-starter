/**
 * LandingPage — Isomorphic marketing page with Motion animations.
 *
 * Isomorphic rules (safe for SSR via renderToString):
 *   • No `meteor/*` imports
 *   • No `window`/`document`/`localStorage` at render time — only in useEffect
 *   • motion/* hooks (useScroll, useTransform, useInView) are client-only;
 *     they render the `initial` state as static HTML during SSR.
 *
 * Animation strategy:
 *   • Hero: staggered word-by-word entrance + animated mesh gradient background
 *   • Parallax orbs driven by useScroll + useTransform (CSS transform only)
 *   • Feature cards: scroll-triggered stagger via useInView
 *   • Nav: blur/border appear on scroll
 *   • Terminal: typewriter line-by-line reveal
 *   • CTA button: shimmer sweep animation
 *   • All animations respect prefers-reduced-motion
 */
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faBolt,
  faChartBar,
  faCircleUser,
  faCode,
  faComments,
  faGlobe,
  faKey,
  faLayerGroup,
  faList,
  faPalette,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import { REPO_URL } from '../lib/constants';
import { useTheme } from '../lib/useTheme';

// ─── Constants ────────────────────────────────────────────────────────────────

const TECH_BADGES = [
  'Meteor 3.5',
  'React 19',
  'Tailwind CSS 4',
  'TypeScript 5',
  'Node.js 22',
  'Rspack',
  'SSR + Hydration',
  'Passwordless Auth',
] as const;

interface Feature {
  icon: typeof faBolt;
  title: string;
  description: string;
  gradient: string;
  glow: string;
}

const FEATURES: Feature[] = [
  {
    icon: faBolt,
    title: 'Real-time DDP',
    description:
      "Reactive data sync between server and client using Meteor's built-in DDP protocol. No polling, no manual cache invalidation — it just works.",
    gradient: 'from-yellow-500/20 to-orange-500/5',
    glow: 'group-hover:shadow-yellow-500/20',
  },
  {
    icon: faKey,
    title: 'Passwordless Auth',
    description:
      'Email magic link authentication powered by accounts-passwordless. Zero passwords, seamless UX, with built-in rate limiting.',
    gradient: 'from-green-500/20 to-emerald-500/5',
    glow: 'group-hover:shadow-green-500/20',
  },
  {
    icon: faPalette,
    title: 'Tailwind CSS 4',
    description:
      'Next-generation utility CSS with the Oxide engine. CSS-first configuration, zero-runtime, and dark mode via custom variant.',
    gradient: 'from-blue-500/20 to-sky-500/5',
    glow: 'group-hover:shadow-blue-500/20',
  },
  {
    icon: faLayerGroup,
    title: 'React 19',
    description:
      'Latest React with concurrent rendering, improved Suspense, and the Actions API. Architecture is Server Components-ready.',
    gradient: 'from-cyan-500/20 to-blue-500/5',
    glow: 'group-hover:shadow-cyan-500/20',
  },
  {
    icon: faGlobe,
    title: 'SSR + Hydration',
    description:
      'Server-side rendering with isomorphic components and client hydration. Full HTML on first byte for instant FCP and perfect SEO.',
    gradient: 'from-purple-500/20 to-violet-500/5',
    glow: 'group-hover:shadow-purple-500/20',
  },
  {
    icon: faCode,
    title: 'TypeScript 5',
    description:
      'End-to-end strict type safety with full Meteor declarations, path aliases, and composite project configuration.',
    gradient: 'from-red-500/20 to-rose-500/5',
    glow: 'group-hover:shadow-red-500/20',
  },
];

const TERMINAL_LINES = [
  { type: 'comment' as const, text: '# Clone the repository' },
  { type: 'cmd' as const, text: `git clone ${REPO_URL}` },
  { type: 'cmd' as const, text: 'cd meteor-react-tailwind-prettier-starter' },
  { type: 'blank' as const, text: '' },
  { type: 'comment' as const, text: '# Install Meteor (once)' },
  { type: 'cmd' as const, text: 'npx meteor@latest' },
  { type: 'blank' as const, text: '' },
  { type: 'comment' as const, text: '# Install deps & start dev server' },
  { type: 'cmd' as const, text: 'meteor npm install && meteor npm run start' },
  { type: 'output' as const, text: '→  http://localhost:3000  ✓ ready' },
];

const STATS = [
  { value: '< 5min', label: 'To first run' },
  { value: '3', label: 'Real-time examples' },
  { value: '100%', label: 'TypeScript' },
  { value: 'MIT', label: 'License' },
];

interface Demo {
  icon: typeof faBolt;
  title: string;
  description: string;
  path: string;
  tag: string;
  gradient: string;
  glow: string;
}

const DEMOS: Demo[] = [
  {
    icon: faComments,
    title: 'Real-time Chat',
    description:
      'Multi-room messaging with grouped threads, clickable user profile links, and instant delivery via DDP. Open two tabs and watch it sync live — zero polling.',
    path: '/app/chat',
    tag: 'Multi-room · Profiles · DDP',
    gradient: 'from-blue-500/20 to-sky-500/5',
    glow: 'group-hover:shadow-blue-500/20',
  },
  {
    icon: faChartBar,
    title: 'Live Polls',
    description:
      'Create polls with 2–8 options, vote, and change your vote. Animated result bars update in real-time across every connected client the moment a vote is cast.',
    path: '/app/polls',
    tag: 'Voting · Animated bars · One-per-user',
    gradient: 'from-violet-500/20 to-purple-500/5',
    glow: 'group-hover:shadow-violet-500/20',
  },
  {
    icon: faList,
    title: 'Reactive Todos',
    description:
      'Drag-to-reorder, active/completed filters, and bulk clear — all synced live across every open client. The classic DDP example, done with proper drag UX.',
    path: '/app/todos',
    tag: 'Drag & drop · Filters · Real-time',
    gradient: 'from-emerald-500/20 to-green-500/5',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    icon: faCircleUser,
    title: 'User Profiles',
    description:
      'Every user gets a public profile with display name, bio, and website. Click any username in chat to view their profile; edit your own from the header dropdown.',
    path: '/app',
    tag: 'Public · Editable · Linked from chat',
    gradient: 'from-rose-500/20 to-pink-500/5',
    glow: 'group-hover:shadow-rose-500/20',
  },
];

const HERO_WORDS_1 = ['The', 'Modern', 'Full-Stack'];
const HERO_HIGHLIGHT = ['React', 'Starter'];

// ─── Reduced-motion hook ──────────────────────────────────────────────────────

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return reduced;
}

// ─── ThemeButton ──────────────────────────────────────────────────────────────

const ThemeButton: React.FC = () => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.svg
            key="sun"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.772 17.303a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 5.106a.75.75 0 011.06 1.06L5.635 7.757a.75.75 0 01-1.061-1.06l1.591-1.591z" />
          </motion.svg>
        ) : (
          <motion.svg
            key="moon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              fillRule="evenodd"
              d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
              clipRule="evenodd"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ─── Parallax orbs ────────────────────────────────────────────────────────────

interface OrbProps {
  scrollY: ReturnType<typeof useSpring>;
  reduced: boolean;
}

const ParallaxOrbs: React.FC<OrbProps> = ({ scrollY, reduced }) => {
  const y1 = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -180]);
  const y2 = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -80]);
  const y3 = useTransform(scrollY, [0, 1000], reduced ? [0, 0] : [0, -260]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-40 -top-20 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px] dark:bg-blue-500/15"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-32 top-10 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[100px] dark:bg-violet-500/10"
      />
      <motion.div
        style={{ y: y3 }}
        className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[80px] dark:bg-cyan-400/8"
      />
    </div>
  );
};

// ─── Mouse-tracking glow ──────────────────────────────────────────────────────

const MouseGlow: React.FC = () => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const background = useMotionTemplate`radial-gradient(600px at ${mx}px ${my}px, rgba(59,130,246,0.07), transparent 80%)`;

  useEffect(() => {
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    const h = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      mx.set(e.clientX - rect.left);
      my.set(e.clientY - rect.top);
    };
    hero.addEventListener('mousemove', h);
    return () => hero.removeEventListener('mousemove', h);
  }, [mx, my]);

  return <motion.div className="pointer-events-none absolute inset-0" style={{ background }} />;
};

// ─── Feature card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: Feature;
  index: number;
  reduced: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index, reduced }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.article
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? {} : { y: -4, scale: 1.015 }}
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-neutral-800/80 dark:bg-neutral-900/80 ${feature.glow}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div className="relative z-10">
        <motion.div
          whileHover={reduced ? {} : { rotate: [0, -10, 10, 0], scale: 1.15 }}
          transition={{ duration: 0.4 }}
          className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-lg dark:bg-neutral-800"
          aria-hidden="true"
        >
          <FontAwesomeIcon icon={feature.icon} />
        </motion.div>
        <h3 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {feature.description}
        </p>
      </div>
    </motion.article>
  );
};

// ─── Demo card ────────────────────────────────────────────────────────────────

interface DemoCardProps {
  demo: Demo;
  index: number;
  reduced: boolean;
}

const DemoCard: React.FC<DemoCardProps> = ({ demo, index, reduced }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.article
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? {} : { y: -4, scale: 1.015 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-neutral-800/80 dark:bg-neutral-900/80 ${demo.glow}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${demo.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <motion.div
          whileHover={reduced ? {} : { rotate: [0, -10, 10, 0], scale: 1.15 }}
          transition={{ duration: 0.4 }}
          className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-lg dark:bg-neutral-800"
          aria-hidden="true"
        >
          <FontAwesomeIcon icon={demo.icon} />
        </motion.div>
        <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-50">{demo.title}</h3>
        <p className="mb-3 text-xs font-medium text-blue-600 dark:text-blue-400">{demo.tag}</p>
        <p className="flex-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {demo.description}
        </p>
        <a
          href={demo.path}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Try it live →
        </a>
      </div>
    </motion.article>
  );
};

// ─── Animated terminal ────────────────────────────────────────────────────────

const AnimatedTerminal: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setVisibleLines(TERMINAL_LINES.length);
      return;
    }
    let i = 0;
    const tick = () => {
      i++;
      setVisibleLines(i);
      if (i < TERMINAL_LINES.length) window.setTimeout(tick, 100 + Math.random() * 120);
    };
    const t = window.setTimeout(tick, 400);
    return () => window.clearTimeout(t);
  }, [inView, reduced]);

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/40"
    >
      <div
        className="flex items-center gap-1.5 border-b border-neutral-800 bg-neutral-900/80 px-4 py-3"
        aria-hidden="true"
      >
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs font-medium text-neutral-500">bash — meteor-starter</span>
      </div>
      <pre className="overflow-x-auto p-6 text-sm leading-7" aria-label="Quick start commands">
        <code>
          {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              {line.type === 'comment' && <span className="text-neutral-600">{line.text}</span>}
              {line.type === 'blank' && <span>&nbsp;</span>}
              {line.type === 'cmd' && (
                <>
                  <span className="select-none text-blue-400">$ </span>
                  <span className="text-neutral-100">{line.text}</span>
                </>
              )}
              {line.type === 'output' && <span className="text-green-400">{line.text}</span>}
            </motion.div>
          ))}
          {visibleLines < TERMINAL_LINES.length && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="inline-block h-4 w-2 bg-blue-400"
              aria-hidden="true"
            />
          )}
        </code>
      </pre>
    </motion.div>
  );
};

// ─── Section heading ──────────────────────────────────────────────────────────

interface SectionHeadingProps {
  id: string;
  title: string;
  subtitle: string;
  reduced: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ id, title, subtitle, reduced }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14 text-center"
    >
      <h2 id={id} className="text-3xl font-bold tracking-tight lg:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      <motion.div
        initial={reduced ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-6 h-px w-20 origin-left bg-gradient-to-r from-blue-500 to-violet-500"
      />
    </motion.div>
  );
};

// ─── Scroll progress bar ──────────────────────────────────────────────────────

const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

// ─── Stats strip ─────────────────────────────────────────────────────────────

const StatsStrip: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 shadow-sm dark:border-neutral-800 dark:bg-neutral-800 sm:grid-cols-4"
    >
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.07 }}
          className="flex flex-col items-center justify-center gap-1 bg-white px-4 py-6 dark:bg-neutral-950"
        >
          <span className="text-2xl font-bold">{stat.value}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

// ─── Animated hero word ───────────────────────────────────────────────────────

interface WordProps {
  word: string;
  index: number;
  reduced: boolean;
  highlight?: boolean;
}

const AnimatedWord: React.FC<WordProps> = ({ word, index, reduced, highlight }) => (
  <motion.span
    className={`inline-block${highlight ? ' text-blue-500 dark:text-blue-400' : ''}`}
    initial={reduced ? false : { opacity: 0, y: 30, rotateX: -30 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 0.6, delay: 0.1 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
    style={{ marginRight: '0.3em' }}
  >
    {word}
  </motion.span>
);

// ─── LandingPage (root) ───────────────────────────────────────────────────────

export const LandingPage: React.FC = () => {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 80, damping: 20 });

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setScrolled(v > 20));
    return unsub;
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <ScrollProgress />

      {/* ── Navigation ── */}
      <motion.header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          scrolled
            ? 'border-b border-neutral-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/90'
            : 'bg-transparent'
        }`}
        initial={reduced ? false : { y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <motion.a
            href="/"
            className="flex items-center gap-2.5 font-semibold"
            whileHover={{ scale: 1.04 }}
          >
            <motion.span
              className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white"
              whileHover={reduced ? {} : { rotate: 20 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <FontAwesomeIcon icon={faBolt} className="text-xs" aria-hidden="true" />
            </motion.span>
            <span>Meteor Starter</span>
          </motion.a>

          <nav aria-label="Site navigation" className="flex items-center gap-2">
            <ThemeButton />
            <motion.a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
            </motion.a>
            <motion.a
              href="/app?mode=signup"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-1 inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Get Started →
            </motion.a>
          </nav>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section
        id="hero-section"
        aria-labelledby="hero-heading"
        className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden py-24 text-center"
      >
        <ParallaxOrbs scrollY={smoothScrollY} reduced={reduced} />
        <MouseGlow />

        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6">
          {/* Status badge */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-1.5 backdrop-blur-sm dark:border-blue-800/50 dark:bg-blue-950/40"
          >
            <motion.span
              animate={reduced ? {} : { scale: [1, 1.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="h-1.5 w-1.5 rounded-full bg-blue-500"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Up-to-date · Meteor 3.5-beta.4 · React 19 · Tailwind CSS 4
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-5xl font-extrabold tracking-tight lg:text-7xl"
            style={{ perspective: '600px' }}
          >
            <span className="block leading-tight">
              {HERO_WORDS_1.map((w, i) => (
                <AnimatedWord key={w} word={w} index={i} reduced={reduced} />
              ))}
            </span>
            <span className="block leading-tight">
              {HERO_HIGHLIGHT.map((w, i) => (
                <AnimatedWord
                  key={w}
                  word={w}
                  index={HERO_WORDS_1.length + i}
                  reduced={reduced}
                  highlight
                />
              ))}
            </span>
          </h1>

          {/* Subtext */}
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-400"
          >
            Production-ready Meteor 3.5 template with real-time{' '}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
              Chat, Polls,
            </strong>{' '}
            and{' '}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-100">Todos</strong>{' '}
            built in — plus passwordless auth, Tailwind CSS 4, TypeScript, and SSR.{' '}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
              Clone and ship.
            </strong>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.68, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2.5 rounded-xl border-2 border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
              View on GitHub
            </motion.a>
            <motion.a
              href="/app?mode=signup"
              whileHover={reduced ? {} : { scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <motion.span
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0"
                initial={{ x: '-100%' }}
                animate={reduced ? {} : { x: '200%' }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5 }}
                aria-hidden="true"
              />
              Get Started Free
              <FontAwesomeIcon icon={faBolt} className="text-xs" aria-hidden="true" />
            </motion.a>
          </motion.div>

          {/* Tech badges */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-12 flex flex-wrap justify-center gap-2"
            aria-label="Technology stack"
          >
            {TECH_BADGES.map((badge, i) => (
              <motion.span
                key={badge}
                initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.9 + i * 0.06 }}
                whileHover={reduced ? {} : { scale: 1.1, y: -2 }}
                className="cursor-default rounded-full border border-neutral-200 bg-neutral-50/80 px-3 py-1 text-xs font-medium text-neutral-600 backdrop-blur-sm dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:text-neutral-400"
              >
                {badge}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          <motion.div
            animate={reduced ? {} : { y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-9 w-5 items-start justify-center rounded-full border-2 border-neutral-400/60 pt-1.5 dark:border-neutral-600"
          >
            <div className="h-2 w-0.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-4">
        <h2 className="sr-only">Project stats</h2>
        <div className="mx-auto max-w-5xl px-6">
          <StatsStrip reduced={reduced} />
        </div>
      </section>

      {/* ── Features ── */}
      <section aria-labelledby="features-heading" className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent dark:via-blue-950/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <SectionHeading
            id="features-heading"
            title="Everything you need to ship"
            subtitle="A curated, modern stack — configured, integrated, and ready to go."
            reduced={reduced}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} reduced={reduced} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Live examples ── */}
      <section aria-labelledby="demos-heading" className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/40 to-transparent dark:via-violet-950/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <SectionHeading
            id="demos-heading"
            title="Batteries included"
            subtitle="Three production-quality real-time examples — remove what you don't need, build on what you do."
            reduced={reduced}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {DEMOS.map((demo, i) => (
              <DemoCard key={demo.title} demo={demo} index={i} reduced={reduced} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Start ── */}
      <section aria-labelledby="quickstart-heading" className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading
            id="quickstart-heading"
            title="Quick Start"
            subtitle="Clone, install, and start developing in minutes."
            reduced={reduced}
          />
          <AnimatedTerminal reduced={reduced} />
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400"
          >
            Then open{' '}
            <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              http://localhost:3000
            </code>{' '}
            in your browser.
          </motion.p>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section aria-labelledby="cta-heading" className="pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 32, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-violet-700 p-px shadow-2xl shadow-blue-500/20"
          >
            <div className="relative rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 px-10 py-14 text-center">
              <motion.div
                animate={reduced ? {} : { rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10"
                aria-hidden="true"
              />
              <motion.div
                animate={reduced ? {} : { rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full border border-white/8"
                aria-hidden="true"
              />
              <h2
                id="cta-heading"
                className="relative z-10 text-3xl font-bold text-white lg:text-4xl"
              >
                Ready to build something great?
              </h2>
              <p className="relative z-10 mx-auto mt-4 max-w-xl text-blue-100/90">
                Grab the starter, fork it, and start building your next Meteor app in minutes. No
                boilerplate setup — it&apos;s already done.
              </p>
              <motion.a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={reduced ? {} : { scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="relative z-10 mt-8 inline-flex items-center gap-2.5 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-lg shadow-black/20 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
                Clone on GitHub
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-200 py-10 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-neutral-500">MIT License · Open source starter template</p>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            {[
              { label: 'GitHub ↗', href: REPO_URL },
              { label: 'Meteor Docs ↗', href: 'https://docs.meteor.com' },
              { label: 'React Docs ↗', href: 'https://react.dev' },
              { label: 'motion.dev ↗', href: 'https://motion.dev' },
            ].map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={reduced ? {} : { y: -2 }}
                className="transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
