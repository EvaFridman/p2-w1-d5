import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "development",
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
  },
  ignoreErrors: [/extension/i, /chrome-extension/i, /network error/i, /failed to fetch/i],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
