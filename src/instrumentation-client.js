// instrumentation-client.js — browser-side Sentry, strictly env-gated.
// No NEXT_PUBLIC_SENTRY_DSN → Sentry.init is never called and nothing is
// ever sent (the app behaves exactly as if Sentry didn't exist).
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    beforeSend(event) {
      // Never leak credentials in error reports.
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });
}

export {};
