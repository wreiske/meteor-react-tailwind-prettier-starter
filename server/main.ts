import '../imports/startup/server';
import '../imports/startup/ssr'; // SSR: onPageLoad renders landing page & injects SEO
// ─── Features ─────────────────────────────────────────────────────────────────
// Each feature is self-contained: remove an import + its AppLayout route entry
// to fully disable that feature.
import '../imports/features/todos/api';
import '../imports/features/chat/api';
import '../imports/features/polls/api';
import '../imports/features/profile/api';

console.log('Server startup - Meteor Starter');
