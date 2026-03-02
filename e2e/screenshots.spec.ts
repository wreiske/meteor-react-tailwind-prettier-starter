import { expect, test } from '@playwright/test';

const SCREENSHOT_DIR = 'public/screenshots';
const TEST_EMAIL = 'screenshots@demo.test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }, theme);
  await page.waitForTimeout(300);
}

async function scrollToSelector(page: import('@playwright/test').Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}

/**
/**
 * Log in by obtaining a login token from the server and applying it client-side.
 * This bypasses the email/inbox flow entirely for reliable E2E testing.
 */
async function login(page: import('@playwright/test').Page) {
  // Navigate to app so Meteor client is loaded
  await page.goto('/app');
  await page.waitForTimeout(2000);

  // Get a login token from the server and log in client-side
  await page.evaluate(async (email) => {
    const result = await new Promise<{ userId: string; token: string }>((resolve, reject) => {
      // @ts-expect-error Meteor is a global
      window.Meteor.call(
        'e2e.loginToken',
        email,
        (err: unknown, res: { userId: string; token: string }) =>
          err ? reject(err) : resolve(res),
      );
    });
    await new Promise<void>((resolve, reject) => {
      // @ts-expect-error Meteor is a global
      window.Meteor.loginWithToken(result.token, (err: unknown) => (err ? reject(err) : resolve()));
    });
  }, TEST_EMAIL);

  await page.waitForTimeout(2000);

  // Seed demo data
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      // @ts-expect-error Meteor is a global
      window.Meteor.call('e2e.seed', (err: unknown) => {
        if (err) {
          const e = err as { error?: string; reason?: string; message?: string };
          reject(new Error(`e2e.seed failed: ${e.reason || e.message || e.error || 'unknown'}`));
        } else {
          resolve();
        }
      });
    });
  });
  await page.waitForTimeout(1000);
}

// ─── Landing Page Screenshots ─────────────────────────────────────────────────

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('hero — light', async ({ page }) => {
    await setTheme(page, 'light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/landing-hero-light.png` });
  });

  test('hero — dark', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/landing-hero-dark.png` });
  });

  test('features — light', async ({ page }) => {
    await setTheme(page, 'light');
    await scrollToSelector(page, '#features-heading');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/features-light.png` });
  });

  test('features — dark', async ({ page }) => {
    await setTheme(page, 'dark');
    await scrollToSelector(page, '#features-heading');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/features-dark.png` });
  });

  test('demos — light', async ({ page }) => {
    await setTheme(page, 'light');
    await scrollToSelector(page, '#demos-heading');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/demos-light.png` });
  });

  test('demos — dark', async ({ page }) => {
    await setTheme(page, 'dark');
    await scrollToSelector(page, '#demos-heading');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/demos-dark.png` });
  });

  test('full page — light', async ({ page }) => {
    await setTheme(page, 'light');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/landing-full-light.png`,
      fullPage: true,
    });
  });

  test('full page — dark', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/landing-full-dark.png`,
      fullPage: true,
    });
  });
});

// ─── Login Page Screenshots ───────────────────────────────────────────────────

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(1500);
  });

  test('login — light', async ({ page }) => {
    await setTheme(page, 'light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/login-light.png` });
  });

  test('login — dark', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/login-dark.png` });
  });
});

// ─── Authenticated App Screenshots ────────────────────────────────────────────

test.describe('App (logged in)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('todos — light', async ({ page }) => {
    await page.goto('/app/todos');
    await page.waitForTimeout(1500);
    await setTheme(page, 'light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/todos-light.png` });
  });

  test('todos — dark', async ({ page }) => {
    await page.goto('/app/todos');
    await page.waitForTimeout(1500);
    await setTheme(page, 'dark');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/todos-dark.png` });
  });

  test('chat — light', async ({ page }) => {
    await page.goto('/app/chat');
    await page.waitForTimeout(2000);
    await setTheme(page, 'light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-light.png` });
  });

  test('chat — dark', async ({ page }) => {
    await page.goto('/app/chat');
    await page.waitForTimeout(2000);
    await setTheme(page, 'dark');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/chat-dark.png` });
  });

  test('polls — light', async ({ page }) => {
    await page.goto('/app/polls');
    await page.waitForTimeout(1500);
    await setTheme(page, 'light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/polls-light.png` });
  });

  test('polls — dark', async ({ page }) => {
    await page.goto('/app/polls');
    await page.waitForTimeout(1500);
    await setTheme(page, 'dark');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/polls-dark.png` });
  });
});

// ─── Smoke test ───────────────────────────────────────────────────────────────

test('all screenshots exist', async () => {
  const fs = await import('fs');
  const expected = [
    'landing-hero-light.png',
    'landing-hero-dark.png',
    'features-light.png',
    'features-dark.png',
    'demos-light.png',
    'demos-dark.png',
    'landing-full-light.png',
    'landing-full-dark.png',
    'login-light.png',
    'login-dark.png',
    'todos-light.png',
    'todos-dark.png',
    'chat-light.png',
    'chat-dark.png',
    'polls-light.png',
    'polls-dark.png',
  ];
  for (const name of expected) {
    expect(fs.existsSync(`${SCREENSHOT_DIR}/${name}`)).toBe(true);
  }
});
